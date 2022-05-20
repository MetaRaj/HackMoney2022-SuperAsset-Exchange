

import WalletConnectProvider from "@walletconnect/web3-provider";
//import Torus from "@toruslabs/torus-embed"
import WalletLink from "walletlink";
import { Alert, Col, Menu, Row } from "antd"; // note the items imported for frontend UI
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react"; // what are these used for??
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Faucet, GasGauge, Header, Ramp, ThemeSwitch } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,   // take note of these hooks for tx execution
  useContractReader,   // take note of these hooks for tx execution
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
// import Hints from "./Hints";

import { Framework } from "@superfluid-finance/sdk-core"
import { Button, Form, FormGroup, FormControl, Spinner, Container } from "react-bootstrap"; 
import { Address } from "./components";
import { Divider } from "antd";


require("dotenv");

//CHECK: is this or alternative is the appropriate customHttpPRovider to use???
//import { customHttpProvider } from "./config";
//export const url =
//  "https://eth-kovan.alchemyapi.io/v2/nl2PDNZm065-H3wMj2z1_mvGP81bLfqX";
//export const customHttpProvider = new ethers.providers.JsonRpcProvider(url);



//add NFT billboard here; note the format and variables that goes into it
//ProductName input for Current Price 50 fDAI equivalent to  10 STAR 
import NFTBillboard from "./views/NFTBillboard"; // Asset Exchange Bank dashboard with ST tokens and lenders info; dai streamed into 


// ExampleUI has CSS code eg button that can be used in appx.jsx or nftbillboard.jsx
// import { ExampleUI, Hints, Subgraph } from "./views"; // ExampleUI excluded as use nftbillboard directly into app.jsx??

import { useContractConfig } from "./hooks";
import Portis from "@portis/web3";
import Fortmatic from "fortmatic";
import Authereum from "authereum";

const { ethers } = require("ethers");
//require("@nomiclabs/hardhat-ethers"); 


/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.mumbai; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544")
  : null;
const poktMainnetProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider(
      "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
    )
  : null;
const mainnetInfura = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
  : null;
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID
// 🏠 Your local provider is usually pointed at your local blockchain


//KEY: 
const localProviderUrl = targetNetwork.rpcUrl;
//console.log("localProviderUrl", localProviderUrl);

// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env

//this should be null as REACT_APP_PROVIDER is not defined in env? 
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv); // = localProviderUrl 

//CHECK: where is this being used in???
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

console.log("localProvider", localProvider);


// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

// Coinbase walletLink init
const walletLink = new WalletLink({
  appName: "coinbase",
});

// WalletLink provider; passed into web3Modal var below
//CHECK: if I need to do link here I will need to use the alchemy_ID ????; 
const walletLinkProvider = walletLink.makeWeb3Provider(`https://polygon-mumbai.g.alchemy.com/v2/OFCnAwgbUNPiQwt6GLxMaV3V4C3kpHYe`, 80001);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9


//CHECK: NO need to connect to wallet at this stage, just pass in signer etc to make it easier/ and faster tx execution
//CHECK: this does not interfere with the alcehmy rpc api 
/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "mumbai", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        alchemyId: "OFCnAwgbUNPiQwt6GLxMaV3V4C3kpHYe",
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai
          80001: "https://polygon-mumbai.g.alchemy.com/v2/OFCnAwgbUNPiQwt6GLxMaV3V4C3kpHYe" //mumbai
        },
      },
    },
    portis: {
      display: {
        logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
        name: "Portis",
        description: "Connect to Portis App",
      },
      package: Portis,
      options: {
        id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
      },
    },
    fortmatic: {
      package: Fortmatic, // required
      options: {
        key: "pk_live_5A7C91B2FC585A17", // required
      },
    },
    // torus: {
    //   package: Torus,
    //   options: {
    //     networkParams: {
    //       host: "https://localhost:8545", // optional
    //       chainId: 1337, // optional
    //       networkId: 1337 // optional
    //     },
    //     config: {
    //       buildEnv: "development" // optional
    //     },
    //   },
    // },
    "custom-walletlink": {
      display: {
        logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
        name: "Coinbase",
        description: "Connect to Coinbase Wallet (not Coinbase App)",
      },
      package: walletLinkProvider,
      connector: async (provider) => {
        await provider.enable();
        return provider;
      },
    },
    authereum: {
      package: Authereum, // required
    },
  },
});

//Total ST of purchaser shown on the front end: could use the method I have in readData.js here in App.jsx and then
//output this on the front end eg via NFTBillboard.js

//async function main( inputs) {   follow exacly the code in createflow; under App()
//Include a section here where you will have the following:
// all the const =  
//the asyn createFLow(), ...... ; input from here (and taken from front end) when passing in arguments for tx
//section for the various calc; borrower input / calc / front end output 


//Declarations before the main() section starts

//Declaration for the tx RECEPIENT =  deployed TradeableCashFlow.sol

//const tradeableCashflowJSON = require("../artifacts/contracts/TradeableCashflow.sol/TradeableCashflow.json");
//const tradeableCashflowABI = tradeableCashflowJSON.abi; 
//const deployedTradeableCashflow = require("../deployments/polytest/TradeableCashflow.json");
//const tradeableCashflowAddress = deployedTradeableCashflow.address;
//Module not found: You attempted to import ../artifacts/contracts/TradeableCashflow.sol/TradeableCashflow.json which falls outside of the project src/ directory. Relative imports outside of src/ are not supported.

const TradeableCashFlowAddress = "0xc502854Fb0F440732F4b98E17Cbdf27d643f83e5"

//your address here: update this to use Borrower account to purchase
//create a borrower on Metamask as Borrower will call the createFlow tx
//CHECK APP.JS: _sender should be inputed from the connected Metamask borrower account???? 
const _sender = "0xC372aC5c65dD863451Aa1D8C9559F9a60aFf2666"



function App() {
  const mainnetProvider =
    poktMainnetProvider && poktMainnetProvider._isProvider
      ? poktMainnetProvider
      : scaffoldEthProvider && scaffoldEthProvider._network
      ? scaffoldEthProvider
      : mainnetInfura;

   

  //Setting initial state vars
  //What is injectedProvider
  const [injectedProvider, setInjectedProvider] = useState(); // starts with undefined
  const [address, setAddress] = useState("0xC372aC5c65dD863451Aa1D8C9559F9a60aFf2666");

  console.log("injectedProvider", injectedProvider);
  console.log("localProvider",localProvider);

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  

  //CHECK: how do I connect to the borrower account on metamask?
  //CHECK: how do I then have metamask to confirm each tx?
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;
  
  console.log("userProviderAndSigner", userProviderAndSigner);
  console.log("userSigner", userSigner) // new to check if the right userSigner is going in; CHECK WHEN TO USE THIS??  



  // useEffect(() => {
  //   async function getAddress() {
  //     if (userSigner) {
  //       const newAddress = await userSigner.getAddress();
  //       setAddress(newAddress);
  //     }
  //   }
  //   getAddress();
  // }, [userSigner]);

  //console.log("Address from userSigner", address);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;
  
  console.log("localProvider",localProvider);


  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks
  
  // The TRANSACTOR wraps transactions and provides notificiations
  //Only for ethereum chain
  const tx = Transactor(userSigner, gasPrice);  // HOW TO USE THIS TO EXECUTE A FUNCTION???

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  const contractConfig = useContractConfig();

  //KEY TO Getting Info from deployed contracts
  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);
  console.log("readContracts", readContracts);

  // If you want to make 🔐 WRITE transactions to your contracts, use the userSigner:
  // userSigner is for which address here???? contractConfig???
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  //useOnBlock(mainnetProvider, () => {
  //  console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  //});


  //KEY READ HOOK for FRONT END PRESENTATION
  //useContractReader hook allows you to read from a (eg _receiver) or any 
  //PUBLIC VARIABLE(eg usreData) in a smart contract
  //initial default message = 'SuperAssetExchange Open'
  //Note: variables must be set to default when starting again when connect with new Borrower address
  //see pattern form SuperCard
  const message = useContractReader(readContracts, "TradeableCashflow", "userData")
  const billboardOwner = useContractReader(readContracts, "TradeableCashflow", "_receiver") 
     


  //CHECK if passed in accurately so can reflect on the frontend
  console.log("message",message);
  console.log("billboardOwner",billboardOwner); 
  
  // SuperToken Balances are available from the SF console or dashboard for the SuperApp
  // once deployed, can obtain the arguments and pass into below
  //???? How doe you get this balance at the end of the stream session; show console(Streaming) and front end (final)
  //const assetTokenBalance = useContractReader(readContracts?????, "AMST", "balanceOf", ["insert the address",]);
  //console.log("assetTokenBalance",assetTokenBalance);


  //console.log("targetNetwork", targetNetwork); /// new
  // console.log("mainnetProvider", mainnetProvider); /// new
  // console.log("readContracts", readContracts); /// new


  // Then read your DAI BALANCE like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    ]);

  // keep track of a variable from the contract in the local React state:
  const purpose = useContractReader(readContracts, "YourContract", "purpose");
  // 📟 Listen for broadcast EVENTS
  const setPurposeEvents = useEventListener(readContracts, "YourContract", "SetPurpose", localProvider, 1);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬 If any changes within [the arguments here] this list will update
  //
  // useEffect(() => {
  //   if (
  //     DEBUG &&
  //     mainnetProvider &&
  //     address &&
  //     selectedChainId &&
  //     yourLocalBalance &&
  //     yourMainnetBalance &&
  //     readContracts &&
  //     writeContracts &&
  //     mainnetContracts
  //   ) {
  //     console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
  //     console.log("🌎 mainnetProvider", mainnetProvider);
  //     console.log("🏠 localChainId", localChainId);
  //     console.log("👩‍💼 selected address:", address);
  //     console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
  //     console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
  //     console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
  //     console.log("📝 readContracts", readContracts);
  //     console.log("🌍 DAI contract on mainnet:", mainnetContracts);
  //     console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
  //     console.log("🔐 writeContracts", writeContracts);
  //   }
  // }, [
  //   mainnetProvider,
  //   address,
  //   selectedChainId,
  //   yourLocalBalance,
  //   yourMainnetBalance,
  //   readContracts,
  //   writeContracts,
  //   mainnetContracts,
  // ]);    


  //This are permanent displays on the frontend

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];
                    console.log("data", data);

                    let switchTx;
                    // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
                    try {
                      switchTx = await ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: data[0].chainId }],
                      });
                    } catch (switchError) {
                      // not checking specific error code, because maybe we're not using MetaMask
                      try {
                        switchTx = await ethereum.request({
                          method: "wallet_addEthereumChain",
                          params: data,
                        });
                      } catch (addError) {
                        // handle "add" error
                      }
                    }

                    if (switchTx) {
                      console.log(switchTx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

 //Another section represeting a permanent display for scaffold-eth

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  let faucetHint = "";
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const [faucetClicked, setFaucetClicked] = useState(false);
  if (
    !faucetClicked &&
    localProvider &&
    localProvider._network &&
    localProvider._network.chainId === 31337 &&
    yourLocalBalance &&
    ethers.utils.formatEther(yourLocalBalance) <= 0
  ) {
    faucetHint = (
      <div style={{ padding: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            faucetTx({
              to: address,
              value: ethers.utils.parseEther("0.01"),
            });
            setFaucetClicked(true);
          }}
        >
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    );
  }



//CREATE FLOW
async function createNewFlow() {
  
  const customHttpProvider = localProvider;

  const sf = await Framework.create({
    networkName: "mumbai", 
    provider: customHttpProvider  
  });

  //Borrower's details directly ehre
  const signerB = sf.createSigner({
    privateKey: "75e1781cdd0006239831f2c6b05f327f59c5722ae6ef69f79d9a86e39f7c0081",
    provider: customHttpProvider
  });

  const fDAIx = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f"
  
  //const userData = web3.eth.abi.encodeParameter('string', 'Seeking Credit Terms');
  const userData = "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000145365656b696e6720437265646974205465726d73000000000000000000000000";

  try {
    const createFlowOperation = sf.cfaV1.createFlow({
      flowRate: "3858024691359", // a 10DAI per month flow to pay for credit application
      receiver: TradeableCashFlowAddress,   
      superToken: fDAIx,
      userData: userData 
    });

    const result = await createFlowOperation.exec(signerB);
    console.log(result);

  } catch (error) {
    console.log(
      "Hmmm, your transaction threw an error. Make sure that this stream does not already exist, and that you've entered a valid Ethereum address!"
    );
    console.error(error);
  }
}

//UPDATE FLOW Timer(include deleteFlow after timeout 60 seconds)
async function updateFlowTimer() {
  
  const customHttpProvider = localProvider;

  const sf = await Framework.create({
    networkName: "mumbai", 
    provider: customHttpProvider  
  });

  //Borrower's details directly ehre
  const signerB = sf.createSigner({
    privateKey: "75e1781cdd0006239831f2c6b05f327f59c5722ae6ef69f79d9a86e39f7c0081",
    provider: customHttpProvider
  });

  const fDAIx = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f"
   
  //inFlowRateST = 200000000000000000;
  //const userData = web3.eth.abi.encodeParameter('int96','200000000000000000'); 
  const userData = "0x00000000000000000000000000000000000000000000000002c68af0bb140000";

  try {
    const updateFlowOperation = sf.cfaV1.updateFlow({
      flowRate:"1250000000000000000",
      receiver: TradeableCashFlowAddress,   
      superToken: fDAIx,
      userData: userData 
    });

    const result = await updateFlowOperation.exec(signerB);
    console.log(result);

  } catch (error) {
    console.log(
      "Hmmm, your transaction threw an error. Make sure that this stream does not already exist, and that you've entered a valid Ethereum address!"
    );
    console.error(error);
  }

//To create a flow that will last for Time Period length only eg 60 seconds
const delayPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      // Resolve the promise
      resolve('60seconds waiting time done')
    }, timePeriod*1000)
  });

  // Invoke delayPromise and wait until it is resolved
  // Once it is resolved assign the resolved promise to a variable
  const delayResult = await delayPromise;

deleteFlow();

}


//DELETE FLOW 
async function deleteFlow() {
  
  const customHttpProvider = localProvider;
  console.log("customHttpProvider",customHttpProvider);

  const sf = await Framework.create({
    networkName: "mumbai", //or use const targetNetwork from above
    provider: customHttpProvider  
  });

  //Borrower's details directly here
  const signerB = sf.createSigner({
    privateKey: "75e1781cdd0006239831f2c6b05f327f59c5722ae6ef69f79d9a86e39f7c0081",  //process.env.MUMBAI_BORROWER_PRIV_KEY
    provider: customHttpProvider
  });
  
  //console.log("signerB",signerB);


  const fDAIx = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f"
  
  //const endel = web3.eth.abi.encodeParameter('string','Asset Exchange Open');
  const userData = "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001341737365742045786368616e6765204f70656e00000000000000000000000000";
    
  //console.log("userData", userData);

  try {
    const deleteFlowOperation = sf.cfaV1.deleteFlow({
      sender: _sender,
      receiver: TradeableCashFlowAddress, 
      superToken: fDAIx,
      userData: userData 
    });

    const result = await deleteFlowOperation.exec(signerB);
    console.log(result);

  } catch (error) {
    console.log(
      "Hmmm, your transaction threw an error. Make sure that this stream does not already exist, and that you've entered a valid Ethereum address!"
    );
    console.error(error);
  }
}


//ProductName input for Current Price 60 fDAI equivalent to  12 STAR (6 STAR =50% asset) 
//pass var into NF Billboard front end presentation

const [walletScore, setWalletScore] = useState("");
const [intRate, setIntRate] = useState("");
const [timePeriod, setTimePeriod] = useState("");
const [assetPrice, setAssetPrice] = useState("60");



//const originalPrice = 60; // this needs to be inputed from NFTBIllboard
const assetSTAR = 12;

const handleWalletScoreChange = (e) => {
    setWalletScore(() => ([e.target.name] = e.target.value));
  };
console.log("WalletScore", walletScore);

const handleIntRateChange = (e) => {
    setIntRate(() => ([e.target.name] = e.target.value));
  };
console.log("IntRate", intRate);


function timePeriodCalc(wScore) {
      if  (wScore >= 10) setTimePeriod(60);
      else  setTimePeriod(90); 
}
console.log("Time Period", timePeriod);

function assetPriceCalc(iRate) {
    if  (iRate <= 300)  setAssetPrice(65);
      else  setAssetPrice(75);
  }
console.log("Asset Price", assetPrice);


//front end presentation
const RflowRateDAI = (assetPrice/timePeriod);
const RinFlowRateST = (assetSTAR/timePeriod);

const flowRateDAI = (assetPrice/timePeriod)*1000000000000000000;
console.log("flowRateDAI", flowRateDAI);

const inFlowRateST = (assetSTAR/timePeriod)*1000000000000000000; 
console.log("inFlowRateST", inFlowRateST);

//show this as  DAI flowRATE nd STAR inFLowRateST per second streaming
//convert to inFlowRateST to show frontend ${flowRateDAI}


//In NFTBillboard: show Originl Asset Price 60 DAI stream exchange for 10 STARs(digital rep for asset ownership)


  return (
    
    <div>
    <Container>
      <Row style={{padding: 10, width: 400, margin: "auto", marginTop: 10}}>
      <Col> 
      <div className = "App">
      
       <NFTBillboard 
          message={message}
          purpose={purpose}
          mainnetProvider={mainnetProvider}
          readContracts={readContracts}
          Bank={TradeableCashFlowAddress}
          assetPrice={assetPrice}
        />
      </div> 
      </Col>
      </Row>

      <Row style ={{marginLeft: 60, marginTop: 10}}>
      <Col>
      
      <div style={{ border: "3px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 10 }}>
       <h2 className = "App">Credit Application</h2>
       <h3 className = "mb-3">Borrower:{_sender}</h3>
       <Form>
        <FormGroup className="mb-3">
          <FormControl
            name="Wallet Score"
            value={walletScore}
            onChange={handleWalletScoreChange}
            placeholder="Wallet Address Score"
          ></FormControl>
        </FormGroup>
        <FormGroup className="mb-3">
          <FormControl style ={{marginTop: 5}}
            name="Interest Rate"
            value={intRate}
            onChange={handleIntRateChange}
            placeholder="Current Interest Rate "
          ></FormControl>
        </FormGroup>
        <Button style ={{marginTop: 10, border: "5px solid #cccccc"}}
          onClick={() => {
            createNewFlow(); 
            timePeriodCalc(walletScore); 
            assetPriceCalc(intRate);
          }}
        >
          Apply for Credit
        </Button>
       </Form>

        <div className="description">
          <p> Application Cost of 10 DAI per month streamed persecond</p>
          <p> Payment continues until Credit Terms are Accepted or Declined </p>
        </div>

    </div> 
    </Col>
    
    <Col style ={{marginLeft: 20}}>
    <div style={{ border: "3px solid #cccccc", padding: 16, width: 400, marginTop: 10 }}>
       <h2 className = "App">Lender Credit Terms</h2>
        <div>Asset Price: <b>{assetPrice}</b></div>
        <div>Time Period: <b>{timePeriod}</b></div>
        <div>DAI Streaming: <b>{flowRateDAI}</b> over Time Period</div>
        <div>STAR Streaming: <b>{RinFlowRateST}</b>over Time Period</div>

        <Button style ={{marginTop: 10, border: "5px solid #cccccc"}}
          onClick={() => {
            updateFlowTimer();
          }}
        >
          Accept: Start Exchange Streaming
        </Button>
        <div>
        <Button style ={{marginTop: 10, border: "5px solid #cccccc"}}
          onClick={() => {
            deleteFlow();
          }}
        >
          Decline Credit Terms
        </Button>
        </div>
        <div className="description">
          <p> DAI will be Streamed from Borrower to Lender</p>
          <p> STAR will be Streamed from Lender to Borrower</p>
        </div>

    </div>
    </Col>
    </Row>
    </Container>

    </div> 
  );
}

export default App;


















      