// import { SyncOutlined } from "@ant-design/icons";
// import { utils } from "ethers";
import { Divider } from "antd";
// import { Button, Card, DatePicker, Divider, Input, List, Progress, Slider, Spin, Switch } from "antd";
//import React, { useState } from "react"; // require this front end 
import { Address } from "../components";
//import { Balance } from "../components";


//Need to reposition into two sections purhaser and bank/SuperApp; How to show streams on front end??? console/dashboard
//Or could create similar template for prurchaser details into anther section

export default function NFTBillboard({
  message,
  billboardOwner,
  mainnetProvider,
  readContracts,
  TradeableCashFlowAddress,
  assetPrice
}) {

  return (
    <div>
      {/*
        ⚙️ Here is a UI that displays and sets the message on your NFT Billboard
        style={{ border: "3px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}
      */}
      <div style={{ border: "3px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 5 }}>
        <h1>SuperAsset Exchange Bank</h1>
        <div>
        Bank Address:{TradeableCashFlowAddress}
{/*        <Address 
          address={readContracts && readContracts.TradeableCashflow ? readContracts.TradeableCashflow.address : null}
          ensProvider={mainnetProvider}
          fontSize={12}
        />*/}
        </div>

        <div>Lender:<b>{billboardOwner}</b></div>
        
        <Divider />
        <div>Status: <b>{message}</b></div>
        <div>Asset Price <b>{assetPrice} DAI</b> SuperTokens</div>
        <div>To be <b>Exchanged Streamed</b> for</div>
        <div><b>12 STAR</b> SuperTokens</div>
        <div>representing<b> Asset Ownership</b></div>

        {/*<div style={{ margin: 8 }}>
            <h3>Lender:<Address address={billboardOwner} /></h3>
        </div>*/}
                
      </div>
      
    </div>
  );
}
