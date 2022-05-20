require("dotenv");
// require("@nomiclabs/hardhat-ethers");
const Web3 = require("web3");

//all addresses hardcoded for mumbai
const hostJSON = require("../artifacts/@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol/ISuperfluid.json")
const hostABI = hostJSON.abi;
const hostAddress = "0xEB796bdb90fFA0f28255275e16936D25d3418603";

const cfaJSON = require("../artifacts/@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol/IConstantFlowAgreementV1.json")
const cfaABI = cfaJSON.abi;
const cfaAddress = "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873";

const tradeableCashflowJSON = require("../artifacts/contracts/TradeableCashflow.sol/TradeableCashflow.json");
const tradeableCashflowABI = tradeableCashflowJSON.abi; 

  //temporarily hardcode contract address 
const deployedTradeableCashflow = require("../deployments/polytest/TradeableCashflow.json");
const tradeableCashflowAddress = deployedTradeableCashflow.address;

//delete a flow
async function main() {

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MUMBAI_ALCHEMY_URL));

  //create contract instances for each of these
  const host = new web3.eth.Contract(hostABI, hostAddress);
  const cfa = new web3.eth.Contract(cfaABI, cfaAddress);
  const tradeableCashflow = new web3.eth.Contract(tradeableCashflowABI, tradeableCashflowAddress);

  //your address here
  //const _sender = process.env.SENDER_ADDRESS

  // tx to be called by Borrower
  const _sender = process.env.BORROWER_ADDRESS;

  const accts = await web3.eth.getAccounts();

  const fDAIx = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f"

  // click button to agreed terms and start streaming according to amount and period
  //userData here reflects that the exchange is open again for new lending
  const userData = web3.eth.abi.encodeParameter('string', 'SuperAssetExchange Open');


  const nonce = await web3.eth.getTransactionCount(_sender, 'latest'); // nonce starts counting from 0

  
  // could insert this into app.jsx with input from timePeriod in SA
  //60 seconds if from the front end
  
  const delayPromise = new Promise((resolve, reject) => {
    // Wait for 5mins
    setTimeout(() => {
      // Resolve the promise
      resolve('60seconds waiting time done')
    }, 60000)
  });

  // Invoke delayPromise and wait until it is resolved
  // Once it is resolved assign the resolved promise to a variable
  const delayResult = await delayPromise


  // Log the result
  console.log(delayResult);


  async function cancelFlow() {
      let cfaTx = (await cfa.methods
     .deleteFlow(
      fDAIx,
      _sender,
      tradeableCashflowAddress,
      "0x"
     )
     .encodeABI())
    //try using callAgreement vs callagreement w context
     let txData = (await host.methods.callAgreement(
      cfaAddress, 
      cfaTx, 
      userData
    ).encodeABI());

    let tx = {
      'to': hostAddress,
      'gas': 3000000,
      'nonce': nonce,
      'data': txData
    }

    let signedTx = await web3.eth.accounts.signTransaction(tx, process.env.MUMBAI_BORROWER_PRIV_KEY);

    await web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
      if (!error) {
        console.log("🎉 The hash of your transaction is: ", hash, "\n Check Alchemy's Mempool to view the status of your transaction!");
      } else {
        console.log("❗Something went wrong while submitting your transaction:", error)
      }
     });

    }
  

  await cancelFlow();

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });