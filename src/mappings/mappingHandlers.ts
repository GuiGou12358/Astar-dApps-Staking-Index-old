import { SubstrateEvent } from "@subql/types";
import { Balance } from "@polkadot/types/interfaces";
import { AnyJson } from "@polkadot/types/types";
import { DApp, Account, Stake, Reward } from "../types";

function getDAppId(smartContract: AnyJson): string {
	let evm = smartContract['evm'];
  	if (evm) {
    	return evm;
  	}
  	let wasm = smartContract['wasm'];
  	if (wasm) {
    	return wasm;
  	}
  	return null;
}

async function getDApp(dAppId: string): Promise<DApp> {
   let dApp = await DApp.get(dAppId);
    if (!dApp) {
		dApp = new DApp(dAppId, false);
    }
    return dApp;
}

async function getAccount(accountId: string): Promise<Account> {
    let account = await Account.get(accountId);
    if (!account) {
		account = new Account(accountId);
    }
  return account;
}

async function getStake(dAppId: string, accountId: string): Promise<Stake> {
    let stakeId = `${dAppId}-${accountId}`;
    let stake = await Stake.get(stakeId);
    if (!stake) {
		stake = new Stake(stakeId, accountId, dAppId, BigInt(0));
    }
  return stake;
}

async function getReward(dAppId: string, accountId: string): Promise<Reward> {
    let rewardId = `${dAppId}-${accountId}`;
    let reward = await Reward.get(rewardId);
    if (!reward) {
		reward = new Reward(rewardId, accountId, dAppId, BigInt(0));
    }
  return reward;
}

export async function registerContract(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract],
        },
    } = event;

    let dAppId = getDAppId(smartContract.toJSON());
    let dApp = await getDApp(dAppId);
	dApp.accountId = account.toString();
	dApp.registered = true;
	await dApp.save();
}


export async function unregisterContract(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract],
        },
    } = event;

    let dAppId = getDAppId(smartContract.toJSON());
    let dApp = await getDApp(dAppId);
	dApp.registered = false;
	await dApp.save();
}


export async function bondAndStake(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    const amount = (balanceOf as Balance).toBigInt();

    let dAppId = getDAppId(smartContract.toJSON());
    let dApp = await getDApp(dAppId);
	await dApp.save();

    let accountId = account.toString();
    let userAccount = await getAccount(accountId);
	await userAccount.save();

    let stake = await getStake(dAppId, accountId);
	stake.totalStake += amount;
	await stake.save();
}


export async function unbondAndUnstake(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    const amount = (balanceOf as Balance).toBigInt();

    let dAppId = getDAppId(smartContract.toJSON());
    let dApp = await getDApp(dAppId);
	await dApp.save();

    let accountId = account.toString();
    let userAccount = await getAccount(accountId);
	await userAccount.save();

    let stake = await getStake(dAppId, accountId);
	stake.totalStake -= amount;
	await stake.save();
}


export async function nominationTransfer(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, originSmartContract, balanceOf, targetSmartContract],
        },
    } = event;

    const amount = (balanceOf as Balance).toBigInt();
    let accountId = account.toString();

    let originDAppId = getDAppId(originSmartContract.toJSON());
    let originDApp = await getDApp(originDAppId);
	await originDApp.save();

    let originStake = await getStake(originDAppId, accountId);
	originStake.totalStake -= amount;
	await originStake.save();

    let targetDAppId = getDAppId(targetSmartContract.toJSON());
    let targetDApp = await getDApp(targetDAppId);
	await targetDApp.save();

    let targetStake = await getStake(targetDAppId, accountId);
	targetStake.totalStake += amount;
	await targetStake.save();

}

export async function reward(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, era, balanceOf],
        },
    } = event;

    const amount = (balanceOf as Balance).toBigInt();

    let dAppId = getDAppId(smartContract.toJSON());
    let dApp = await getDApp(dAppId);
	await dApp.save();

    let accountId = account.toString();
    let userAccount = await getAccount(accountId);
	await userAccount.save();

    let reward = await getReward(dAppId, accountId);
	reward.totalReward += amount;
	await reward.save();
}