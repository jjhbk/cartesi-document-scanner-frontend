import { useConnectWallet, useSetChain } from "@web3-onboard/react";
import { FC, useState } from "react";
import configFile from "../config.json";
const config: any = configFile;
export const Network: FC = () => {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const [dappAddress, setDappAddress] = useState<string>(
    process.env.NEXT_PUBLIC_DAPP_AMOY_ADDRESS
      ? process.env.NEXT_PUBLIC_DAPP_AMOY_ADDRESS
      : "0xab7528bb862fb57e8a2bcd567a2e929a0be56a5e"
  );
  console.log(process.env.NEXT_PUBLIC_DAPP_AMOY_ADDRESS);
  return (
    <div className="flex p-5">
      {!wallet && (
        <button
          className="bg-sky-500 flex-1 mx-5 justify-self-center self-center rounded-md p-5 text-2xl shadow-sm focus:outline-none focus:ring  hover:bg-sky-700"
          onClick={() => connect()}
        >
          {connecting ? "connecting" : "Connect-Wallet"}
        </button>
      )}
      {wallet && (
        <div>
          <label className=" box-border p-2 border-2 mx-2 dark:text-slate-200">
            Switch Chain
          </label>
          {settingChain ? (
            <span>Switching chain...</span>
          ) : (
            <select
              className="box-decoration-clone box-border p-2 border-2 mx-2 dark:text-slate-200 bg-orange-500"
              onChange={({ target: { value } }) => {
                if (config[value] !== undefined) {
                  setChain({ chainId: value });
                } else {
                  alert("No deploy on this chain");
                }
              }}
              value={connectedChain?.id}
            >
              {chains.map(({ id, label }) => {
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          )}
          <button
            className="bg-sky-500 rounded-md p-2 text-sm shadow-sm focus:outline-none focus:ring  hover:bg-sky-700"
            onClick={() => disconnect(wallet)}
          >
            Disconnect Wallet
          </button>
          <div className="flex flex-row my-2 justify-start">
            <h2 className=" box-border border-2 mx-2 p-2 justify-self-center self-center ">
              Dapp Address :{" "}
            </h2>
            <input
              className="box-border border-2 p-2 mx-2 bg-orange-500"
              type="text"
              value={dappAddress}
              onChange={(e) => setDappAddress(e.target.value)}
            />
            <br />
            <br />
          </div>
        </div>
      )}
    </div>
  );
};
