// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import {
    ISuperfluid,
    ISuperToken,
    ISuperApp,
    ISuperAgreement,
    ContextDefinitions,
    SuperAppDefinitions
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
// When ready to move to leave Remix, change imports to follow this pattern:
// "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {
    IConstantFlowAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import {
    CFAv1Library
} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

import {
    SuperAppBase
} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";


contract RedirectAll is SuperAppBase {

    ISuperfluid public _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    ISuperToken private _acceptedToken; // accepted token
    ISuperToken private _assetToken; // assetToken 
    address public _receiver;

    using CFAv1Library for CFAv1Library.InitData;
    CFAv1Library.InitData cfaV1; //initialize cfaV1 variable

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        ISuperToken acceptedToken,
        ISuperToken assetToken,
        address receiver) {
        
        assert(address(host) != address(0));
        assert(address(cfa) != address(0));
        assert(address(acceptedToken) != address(0));
        assert(address(assetToken) != address(0));
        assert(address(receiver) != address(0));
        //assert(!_host.isApp(ISuperApp(receiver)));

        _host = host;
        _cfa = cfa;
        _acceptedToken = acceptedToken;
        _assetToken = assetToken; // new ST address will be passed in through constructor
        _receiver = receiver; // this is SA owner address

        uint256 configWord =
            SuperAppDefinitions.APP_LEVEL_FINAL |
            // change from 'before agreement stuff to after agreement
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        _host.registerApp(configWord);

        //initialize InitData struct, and set equal to cfaV1
        cfaV1 = CFAv1Library.InitData(
        host,
        //here, we are deriving the address of the CFA using the host contract
        IConstantFlowAgreementV1(
            address(host.getAgreementClass(
                    keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1")
                ))
            )
        );

    }



    /**************************************************************************
     * Redirect Logic
     //Mine: receiver here is owner of superapp but should be the sender/customer who is streamed back asset Tokens
     //Mine: note to change the outflow token to assetToken when change owner of the SuperApp
     *************************************************************************/

    function currentReceiver()
        external view
        returns (
            uint256 startTime,
            address receiver,
            int96 flowRate
        )
    {
        if (_receiver != address(0)) {
            (startTime, flowRate,,) = _cfa.getFlow(_acceptedToken, address(this), _receiver);
            receiver = _receiver;
        }
    }

    event ReceiverChanged(address receiver); 



/// @dev If a new stream is opened, or an existing one is opened
// the sender of DAI and receiver of the ST should be the borrower check this!!!
//the DAI payment is kept in the SA (notsure if can transfer this out to the owner via another newCtx)

//Note: when update stream(stream out ST to borrower),check if the initial createFlow stream out to owner is still running? If it is and this needs to be calcelled?but then need to createFlow again which then updatestream cant be used(because update streams out ST, while createFlow streams out DAI)??
    
    function _updateOutflow(bytes calldata ctx, address borrower)
        private
        returns (bytes memory newCtx)
    {
      newCtx = ctx;
      
      // @dev This will give me the NEW flowRate, as it is called in after callbacks, flowrate is int96 and not uint256
      //mine: note flow rate is token specific; to aggregate with assetToken to get the actual net flow
      
      int96 netFlowRate = _cfa.getNetFlow(_acceptedToken, address(this)) 
                        + _cfa.getNetFlow(_assetToken, address(this));  
      (,int96 outFlowRate,,) = _cfa.getFlow(_assetToken, address(this), borrower);
      int96 inFlowRate = netFlowRate + outFlowRate; // is ok if flows in and out are the same eventhough diff token?
      
      
      //(,int96 inFlowRate,,) = _cfa.getFlow(_acceptedToken, borrower, address(this));
      //(,int96 outFlowRateA,,) = _cfa.getFlow(_assetToken, address(this), borrower);  
      //(,int96 outFlowRateB,,) = _cfa.getFlow(_acceptedToken, address(this), _receiver);
      //int96 outFlowRate = outFlowRateA + outFlowRateB;        

      if (inFlowRate < 0 ) {
          inFlowRate = inFlowRate * -1; // Fixes issue when inFlowRate is negative
      }


      // @dev If inFlowRate === 0, then delete existing flow.
      //Note: after createFlow if credit terms not accepted then onclick deleteFlow button 

     if (inFlowRate == int96(0)) {
        // @dev if inFlowRate is zero, delete outflow
        // for delete to work, there must a stream of the same token already present
        newCtx = cfaV1.deleteFlowWithCtx(newCtx,address(this), borrower, _assetToken);
     }
      else if (inFlowRate > 4000000000000) {  
       
        //inFlowRateST into creteFlow below: CHECK can this can be used to pass when updateFlow activated???

        newCtx = cfaV1.createFlowWithCtx(ctx, borrower, _assetToken, inFlowRateST);
        //newCtx = cfaV1.updateFlowWithCtx(ctx, borrower, _assetToken, inFlowRate);
      } 
      
      //else 
      //{
      
      // @dev If there is no existing outflow, then create new flow to equal inflow
      // @dev if new flow, then the DAI goes to owner as outflow from SuperApp
      // if inflowRate = a specific no of DAi, then dont want to newCtx = 0 so DAI stays in SuperApp
      // or set inflowRate = int96(0) for the createFlowCt      
      //newCtx = cfaV1.createFlowWithCtx(ctx, _receiver, _acceptedToken, inFlowRate);
      //}
    

    }


    // @dev Change the Receiver of the total flow
    //mine: need to update for assetToken. But we are not considering transfering ownership of SA
    function _changeReceiver( address newReceiver ) internal {
        require(newReceiver != address(0), "New receiver is zero address");
        // @dev because our app is registered as final, we can't take downstream apps
        require(!_host.isApp(ISuperApp(newReceiver)), "New receiver can not be a superApp");
        // @dev only engage in flow editting if there is active outflow and transfer is not to self
        (,int96 outFlowRate,,) = _cfa.getFlow(_acceptedToken, address(this), _receiver);
        if (newReceiver == _receiver || outFlowRate == 0) return ;
        // @dev delete flow to old receiver
        cfaV1.deleteFlow(address(this), _receiver, _acceptedToken);
        // @dev create flow to new receiver
        cfaV1.createFlow(newReceiver, _acceptedToken, _cfa.getNetFlow(_acceptedToken, address(this)));
        // @dev set global receiver to new receiver
        _receiver = newReceiver;

        emit ReceiverChanged(_receiver);
    }

    //public variables which we'll set userData values to
    ISuperfluid.Context public uData;
    string public userData;
    

    //The flow rate ST over timePeriod, converted to gwei per second
    //calculate per second wei to get assetPrice over timePeriod, used when updateFlow callback triggered
    //inFlowRateST = (assetPrice/timePeriod)*(10^18);
    
    int96 inFlowRateST;  //cant seem to be picked up in updateFlow function above, gives error 
    

    
     /**************************************************************************
     * SuperApp callbacks
     *************************************************************************/


    function afterAgreementCreated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata /*_agreementData*/,
        bytes calldata ,// _cbdata,
        bytes calldata _ctx
    )
        external override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        
        // decode Context - store full context as uData variable for easy visualization purposes
        ISuperfluid.Context memory decompiledContext = _host.decodeCtx(_ctx);
        uData = decompiledContext;

        address borrower =  _host.decodeCtx(_ctx).msgSender; 
        
        userData = abi.decode(decompiledContext.userData, (string));


        return _updateOutflow(_ctx, borrower);
    }

    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 ,//_agreementId,
        bytes calldata /*_agreementData*/,
        bytes calldata ,//_cbdata,
        bytes calldata _ctx
    )
        external override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCt)
    {
        ISuperfluid.Context memory decompiledContext = _host.decodeCtx(_ctx);
        uData = decompiledContext;

        address borrower =  _host.decodeCtx(_ctx).msgSender;

        inFlowRateST = abi.decode(decompiledContext.userData, (int96));
        
        userData = "Asset Exchange InProgress";
         

        return _updateOutflow(_ctx, borrower);
    }

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32 ,//_agreementId,
        bytes calldata, // _agreementData,
        bytes calldata ,//_cbdata,
        bytes calldata _ctx
    )
        external override
        onlyHost
        returns (bytes memory newCtx)
    {
        // According to the app basic law, we should never revert in a termination callback
        if (!_isSameToken(_superToken) || !_isCFAv1(_agreementClass)) return _ctx;
        
        ISuperfluid.Context memory decompiledContext = _host.decodeCtx(_ctx);
        uData = decompiledContext;

        address borrower =  _host.decodeCtx(_ctx).msgSender;

        userData = abi.decode(decompiledContext.userData, (string));
        
        return _updateOutflow(_ctx, borrower);
    }

    function _isSameToken(ISuperToken superToken) private view returns (bool) {
        return address(superToken) == address(_acceptedToken);
    }

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return ISuperAgreement(agreementClass).agreementType()
            == keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1");
    }

    modifier onlyHost() {
        require(msg.sender == address(_host), "RedirectAll: support only one host");
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(_isSameToken(superToken), "RedirectAll: not accepted token");
        require(_isCFAv1(agreementClass), "RedirectAll: only CFAv1 supported");
        _;
    }
}


//Earlier Version:

//Var declaration section
    //bytes Rating;
    //int96 IntRate;
    //int96 OriginalP; 

 
    // show the following under Approved : assetPrice = ; timePeriod =; click button "Accept Loan"
    //int96 public assetPrice;  // appear on front end; passed into updataFlow via inFlowRateST 
    //int96 public timePeriod; // appear on front end; passed into timeout function in App.jsx

    //The flow rates of assetPrice in DAI and asset over timePeriod, converted to gwei per second
    //int96 public inFlowRateST;


//(userData,Rating,IntRate,OriginalP) = abi.decode(decompiledContext.userData, (string,bytes,int96,int96)); 
        //solidity is not picking up any of the varibles here
            
        // input into timeout in app.jsx for updateFlow tx where timePeriod is in seconds
        //timePeriod = abi.decode(Rating, (int96));  

        //condition to inflate assetPrice based on interest rate
        //if (IntRate < 300) assetPrice = OriginalP;  // price if paid today
        //else assetPrice = (OriginalP + 1); //show on front end  

        //calculate per second wei to get assetPrice over timePeriod, used when updateFlow callback triggered
        //inFlowRateST = (assetPrice/timePeriod)*(10^18);