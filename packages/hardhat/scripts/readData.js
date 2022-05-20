require("dotenv");
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
  
//read flowData
async function main() {

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MUMBAI_ALCHEMY_URL));
//console.log("web3", web3);

  //create contract instances for each of these
  const host = new web3.eth.Contract(hostABI, hostAddress);
  const cfa = new web3.eth.Contract(cfaABI, cfaAddress);
  const tradeableCashflow = new web3.eth.Contract(tradeableCashflowABI, tradeableCashflowAddress);
  const fDAIx = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f";
  const STAR = '0x6f7b862655d992e97160c2336b0534fd8df26c16' ;


  //get data: for single entry string userData
  // const decodedContext = await tradeableCashflow.methods.uData().call();
  // const decodedUserData = web3.eth.abi.decodeParameter('string', decodedContext.userData);
  // console.log(decodedContext)
  // console.log(decodedUserData)

  const decodedContext = await tradeableCashflow.methods.uData().call();
  const decodedUserData = web3.eth.abi.decodeParameter('int96', decodedContext.userData);

  

  const enCreate = web3.eth.abi.encodeParameter('string','Seeking Credit Terms');
  console.log("enCreare", enCreate);

  const enUpdate = web3.eth.abi.encodeParameter('int96','200000000000000000');
  console.log("enUpdate", enUpdate);

  const endel = web3.eth.abi.encodeParameter('string','Asset Exchange Open');
  console.log("endel", endel);


  
  
  //get jail info
  const jailed = await host.methods.getAppManifest(tradeableCashflowAddress).call()
  console.log(jailed)
  const isJailed = await host.methods.isAppJailed(tradeableCashflowAddress).call();
  console.log(`is jailed: ${isJailed}`);

  // getFlow function??? what is the contract address in the argument?
  //const flowInfo = await cfa.methods.getFlow(fDAIx, tradeableCashflowAddress, "0x00471Eaad87b91f49b5614D452bd0444499c1bd9").call();
  
  // const flowInfo = await cfa.methods.getFlow(fDAIx, tradeableCashflowAddress, "0x50d12B009b4118546d82A3c5678C0Af7a7fbB5cD").call();
  // const outFlowRate = Number(flowInfo.flowRate); 
  // console.log(`Outflow Rate: ${outFlowRate}`); 

  // const netFlow = await cfa.methods.getNetFlow(fDAIx, tradeableCashflowAddress).call();
  // console.log(`Net flow: ${netFlow}`);

  // const flow = await cfa.methods.getFlow(fDAIx, tradeableCashflowAddress, "0x50d12B009b4118546d82A3c5678C0Af7a7fbB5cD").call();
  // const inFlow = Number(flow.flowRate);
  // console.log(`In flow: ${inFlow}`);

  // const flowB = await cfa.methods.getFlow(STAR, tradeableCashflowAddress,"0x50d12B009b4118546d82A3c5678C0Af7a7fbB5cD").call();
  // const outFlow = Number(flowB.flowRate);
  // console.log(`Out flow: ${outFlow}`); 

  // const netFlowB = await cfa.methods.getNetFlow(STAR, tradeableCashflowAddress).call();
  // console.log(`Net flowB: ${netFlowB}`);  

  // relook at this formula
  // const inFlowRate = Number(netFlow) + Number(netFlowB) + outFlowRate;
  // console.log(`Inflow rate: ${inFlowRate}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });