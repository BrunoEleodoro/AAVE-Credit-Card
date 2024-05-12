const ethers = require('ethers');
const BigNumber = require('bignumber.js');
const dotenv = require('dotenv');
dotenv.config();

const erc20ABI = [
    "event Transfer(address indexed from, address indexed to, uint amount)"
];
const AAVECreditCardABI = [
    {
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			}
		],
		"name": "borrow",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
]

// Function to create a provider and set up listeners
function setupProvider(url) {
    let provider = new ethers.JsonRpcProvider(url);

    provider.on("error", (err) => {
        console.error(`Provider error: ${err}. Attempting to reconnect...`);
        setTimeout(() => setupProvider(url), 3000); // Reconnect after 3 seconds
    });

    return provider;
}

const arbProvider = setupProvider(process.env.ARB_PROVIDER_URL);
const celoProvider = setupProvider(process.env.CELO_PROVIDER_URL);
const arbWallet = new ethers.Wallet(process.env.ARB_PRIVATE_KEY, arbProvider);

const tokenAddress = '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787';

// Create a contract instance
const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, celoProvider);
const myAddress = '0x0cC9D7fAc744E700F44E307eD90c07EC54e51D9A';

async function main() {
    const AAVECreditCardContract = new ethers.Contract(process.env.AAVE_CREDIT_CARD_ADDRESS, AAVECreditCardABI, arbWallet);
    const amount = BigNumber("38098289100902000000");
    const dollarsOnArb = amount.dividedBy(10**18).dividedBy(5).multipliedBy(10**6);
    const finalAmount = dollarsOnArb.integerValue(BigNumber.ROUND_FLOOR);
    console.log('Dollars on arb:', finalAmount.toString());
    console.log(arbWallet.address)
    const res = await AAVECreditCardContract.borrow(finalAmount.toString(), { gasLimit: 1000000 });
    console.log('BORROW!!')
    console.log(res);
}

main();

// // Filter for transfers to a specific address
// tokenContract.on(tokenContract.filters.Transfer(null, myAddress), async (from, to, amount, event) => {
//     console.log(`Transfer to ${myAddress} | from: ${from} | amount: ${ethers.utils.formatEther(amount)} | blockNumber: ${event.blockNumber}`);
//     // const dollars = amount.div(5);
//     // convert the 18 decimals to 6 decimals, but first I need to conver the BRL to USD
//     const dollarsOnArb = amount.div(10**12);
//     const res = await AAVECreditCardContract.borrow(dollarsOnArb);
//     console.log('BORROW!!')
//     console.log(res);
// });

