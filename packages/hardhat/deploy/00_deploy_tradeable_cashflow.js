require("dotenv").config();

// mumbai addresses - change if using a different network
const host = '0xEB796bdb90fFA0f28255275e16936D25d3418603';
const cfa = '0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873';
const fDAIx = '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f';
const fUSDCx = '0x42bb40bF79730451B11f6De1CbA222F17b87Afd7';


//address for customeST deployed and initialised on mumbai testnet
const STAR = '0x6f7b862655d992e97160c2336b0534fd8df26c16' ; 


const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const Web3 = require("web3");
const { defaultNetwork } = require("../hardhat.config");
const config = require("../hardhat.config");


require("dotenv");
//your address here...
const owner = '0x50d12B009b4118546d82A3c5678C0Af7a7fbB5cD';

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  console.log(deployer);

  const errorHandler = (err) => {
    if (err) throw err;
  };

  if (defaultNetwork == 'ganache' || defaultNetwork == 'localhost') {
        
    await deployFramework(errorHandler, {
      web3,
      from: deployer,
    });
  
    await deployTestToken(errorHandler, [":", "fDAI"], {
      web3,
      from: deployer,
    });
    await deploySuperToken(errorHandler, [":", "fDAI"], {
      web3,
      from: deployer,
    });
  
    let sf = new SuperfluidSDK.Framework({
      web3,
      version: "test",
      tokens: ["fDAI"],
    });
  
    await sf.initialize();
  
    console.log(sf.host.address)
    console.log(sf.agreements.cfa.address);
    console.log(sf.tokens.fDAIx.address)
  
    await deploy("TradeableCashflow", {
      from: deployer,
      args: [deployer, 'nifty_billboard', 'NFTBoard', sf.host.address, sf.agreements.cfa.address, sf.tokens.fDAIx.address],
      log: true,
    })
  }

// include arguments here as required by the constructor in TradeableCashFlow.sol, add stFac
  else {
    await deploy("TradeableCashflow", {
      from: deployer,
      args: [deployer, 'Credit Platform', 'SuperAssetExchange', host, cfa, fDAIx, STAR],
      log: true,
    })
  }

};
module.exports.tags = ["TradeableCashflow"];
