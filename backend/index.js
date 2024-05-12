const axios = require('axios');
const dotenv = require('dotenv');
const ethers = require('ethers');

dotenv.config();

const GRAPH_QL_URL = process.env.GRAPH_QL_URL;
const query = `query MyQuery {
    transfers(
      where: {to: "0x0cC9D7fAc744E700F44E307eD90c07EC54e51D9A"}
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      from
      blockTimestamp
      blockNumber
      to
      transactionHash
      value
    }
  }`

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Function to create a provider and set up listeners
function setupProvider(url) {
    let provider = new ethers.JsonRpcProvider(url);

    provider.on("error", (err) => {
        console.error(`Provider error: ${err}. Attempting to reconnect...`);
        setTimeout(() => setupProvider(url), 3000); // Reconnect after 3 seconds
    });

    return provider;
}

async function main() {
    const arbProvider = setupProvider(process.env.ARB_PROVIDER_URL);
    const arbWallet = new ethers.Wallet(process.env.ARB_PRIVATE_KEY, arbProvider);

    // Create a contract instance
    let response = undefined;

    while (true) {
        try {
            console.log('querying...');
            const res = await axios.post(GRAPH_QL_URL, { query });

            if (response === undefined) {
                response = res.data.data.transfers;
            } else {
                if (response.length !== res.data.data.transfers.length) {
                    console.log(res.data.data.transfers);
                    console.log('New transfer found!');
                    const transfer = res.data.data.transfers[0];
                    const amount = BigNumber(transfer.value);

                    // Calculate the dollar equivalent on Arbitrum
                    const dollarsOnArb = amount.dividedBy(10 ** 18).dividedBy(5).multipliedBy(10 ** 6);
                    const finalAmount = dollarsOnArb.integerValue(BigNumber.ROUND_FLOOR);
                    console.log('Dollars on arb:', finalAmount.toString());
                    console.log(arbWallet.address)

                    try {
                        const res = await AAVECreditCardContract.borrow(finalAmount.toString(), { gasLimit: 1000000 });
                        response = res.data.data.transfers;
                        console.log('BORROW!!')
                        console.log(res);
                    } catch (err) {
                        console.error('Error executing borrow:', err);
                    }
                } else {
                    console.log('No new transfers found.');
                }
            }
        } catch (error) {
            console.error(error);
        }

        await sleep(60000);
    }
}

main();