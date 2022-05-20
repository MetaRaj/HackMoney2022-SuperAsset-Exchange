const hre = require("hardhat");
require("dotenv");
const Web3 = require("web3");

//all addresses hardcoded for mumbai - will only work on mumbai deployment
// const hostJSON = require("../artifacts/@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol/ISuperfluid.json")
// const hostABI = hostJSON.abi;
// const hostAddress = "0xEB796bdb90fFA0f28255275e16936D25d3418603";

// const cfaJSON = require("../artifacts/@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol/IConstantFlowAgreementV1.json")
// const cfaABI = cfaJSON.abi;
// const cfaAddress = "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873";

// const tradeableCashflowJSON = require("../artifacts/contracts/TradeableCashflow.sol/TradeableCashflow.json");
// const tradeableCashflowABI = tradeableCashflowJSON.abi; 

// //temporarily hardcode contract address and sender address
// //need to manually enter contract address and sender address here
// const deployedTradeableCashflow = require("../deployments/polytest/TradeableCashflow.json");
// const tradeableCashflowAddress = deployedTradeableCashflow.address;

//your address here: update this to use Borrower account to purchase
const _sender = process.env.SENDER_ADDRESS;


const mintableSuperTokenJSON = require("../artifacts/contracts/MintableSuperToken.sol/MintableSuperToken.json");
const mintableSuperTokenABI = mintableSuperTokenJSON.abi;

//Check in the .json after deploying the contract for the contract address, compare with alchemy output
const deployedMintableSuperToken = require("../deployments/polytest/MintableSuperToken.json");
const mintableSuperTokenAddress = deployedMintableSuperToken.address;

//MintableSuperToken address after deployment, looking at Etherscan
//Confirmed as below
//mintableSuperTokenAddress = 0x6f7b862655d992e97160c2336b0534fd8df26c16

//Custom Super Token information to Initialize ; mumbai address for SuperTokenFactory
const nameST = 'SuperToken with Asset Rights';
const symbolST = 'STAR';
const stFac = '0x200657E2f123761662567A1744f9ACAe50dF47E6';


//initialize the custom super token
async function main() {

  // Provider has been defined here. Need to define this on App.jsx and remove the current infura etc assignment
  const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MUMBAI_ALCHEMY_URL));

  // const host = new web3.eth.Contract(hostABI, hostAddress);
  // const cfa = new web3.eth.Contract(cfaABI, cfaAddress);
  // const tradeableCashflow = new web3.eth.Contract(tradeableCashflowABI, tradeableCashflowAddress); 
  // const fDAIx = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f"
 
  const mintableSuperToken = new web3.eth.Contract(mintableSuperTokenABI, mintableSuperTokenAddress);

  const nonce = await web3.eth.getTransactionCount(_sender, 'latest'); // nonce starts counting from 0

  // function initialize(string memory name, string memory symbol, address factory) external {
  //      _initialize(name, symbol, factory);


  async function initialize() {
   
   let initTx = (await mintableSuperToken.methods
     .initialize(
      nameST,
      symbolST,
      stFac
     ).encodeABI())

    let tx = {
      'to': mintableSuperTokenAddress,
      'gas': 3000000,
      'nonce': nonce,
      'data': initTx
    }

    let signedTx = await web3.eth.accounts.signTransaction(tx, process.env.MUMBAI_DEPLOYER_PRIV_KEY);

    await web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
      if (!error) {
        console.log("🎉 The hash of your transaction is: ", hash, "\n Check Alchemy's Mempool to view the status of your transaction!");
      } else {
        console.log("❗Something went wrong while submitting your transaction:", error)
      }
     });

    }
  

  await initialize();

  }

//Could then catach(error) paten below be similar to try catch sytax???

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });