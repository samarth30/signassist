require("dotenv").config();
const express = require("express");
const fs = require("fs");
var cors = require("cors");
const Web3 = require("web3");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 3001;

const loaddata = (file) => {
  try {
    a = `./data.json`;

    const dataBuffer = fs.readFileSync(a.toString());
    const dataJSON = dataBuffer.toString();
    return JSON.parse(dataJSON);
  } catch (e) {
    return [];
  }
};

const web3 = new Web3(process.env.ETHEREUM_NODE_API);

const savedata = async (data) => {
  const dataJSON = await JSON.stringify(data);
  await fs.writeFileSync("data.json", dataJSON);
};

const corsOpts = {
  origin: "*",

  methods: ["GET", "POST"],

  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOpts));
app.use(bodyParser.json());
bodyParser.urlencoded({ extended: true });

app.post("/tenderlyFork", async (req, res) => {
  let inputBody, responseFinal;
  let website = req?.body?.website;
  try {
    let transactionParameters = req.body.transactionParameters;
    username = process.env.TENDERLY_USER_NAME;
    const api = `https://api.tenderly.co/api/v1/account/${username}/project/project/simulate`;

    let tx = transactionParameters[0];

    const nameOfContract = await axios.get(
      `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY_ETHEREUM}`
    );

    // console.log(nameOfContract.data.result.ProposeGasPrice);

    const a = web3.utils.toWei(
      nameOfContract.data.result.ProposeGasPrice,
      "gwei"
    );

    if (!tx.from && !tx.to && !tx.data && !tx.gas) {
      throw new Error("not defined varaiables from api");
    }

    // let balanceOfAccount = await web3.eth.getBalance(tx.from);

    // console.log(balanceOfAccount);

    var tenderlyBody = {
      network_id: tx.network_id,
      from: tx.from,
      to: tx.to,
      input: tx.data,
      gas: parseInt(tx.gas, 16),
      gas_price: a,
      value: tx.value, // has a tendency to overflow so we use string
    };

    const headers = {
      headers: {
        "content-type": "application/JSON",
        "X-Access-Key": process.env.TENDERLY_ACCESS_KEY,
      },
    };

    const response = await axios.post(api, tenderlyBody, headers);
    await savedata({ response: response.data });
    responseFinal = response.data;

    let result = responseFinal;

    const dangerousEvents = ["Transfer", "Approval", "ApprovalForAll"];

    var outputTransactions = [];

    const events =
      result["transaction"]["transaction_info"]["call_trace"]["logs"];
    for (const event of events) {
      if (dangerousEvents.includes(event["name"])) {
        var tenderlyEvent = {
          contract_address: event["raw"]["address"],
          function_name: event["name"],
          from: event["inputs"][0]["value"],
          to: event["inputs"][1]["value"],
          tokenId: event["inputs"][2]["value"],
        };
        for (const contract of result["contracts"]) {
          if (contract["address"] == tenderlyEvent.contract_address) {
            tenderlyEvent["token_name"] = contract["token_data"]?.["name"];
            tenderlyEvent["token_symbol"] = contract["token_data"]?.["symbol"];
          }
        }
        outputTransactions.push(tenderlyEvent);
      }
    }

    res.send(
      // ResponeObject
      {
        success: "true",
        simulation: {
          date: new Date().getTime(),
          result: true,
          events: outputTransactions,
        },
      }
    );
  } catch (e) {
    console.log(e);

    res.send({
      // success: "error",
      // error: e?.response?.data?.error ? e?.response?.data?.error : e,
      error: "facing error while doing the transaction",
    });
  }
});

app.post("/transactionDataRead/:id", async (req, res) => {
  const params = req.params.id;
  let website = req?.body?.website;

  if (website.includes("https://roboxminting.netlify.app")) {
    // const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    // await delay(3000);
    try {
      const transactionResponse = await loaddata(params);
      let result = transactionResponse.response;

      // const ResponeObject = await TransactionReadFunction(result);

      const dangerousEvents = ["Transfer", "Approval", "ApprovalForAll"];

      var outputTransactions = [];

      const events =
        result["transaction"]["transaction_info"]["call_trace"]["logs"];
      for (const event of events) {
        if (dangerousEvents.includes(event["name"])) {
          var tenderlyEvent = {
            contract_address: event["raw"]["address"],
            function_name: event["name"],
            from: event["inputs"][0]["value"],
            to: event["inputs"][1]["value"],
            tokenId: event["inputs"][2]["value"],
          };
          for (const contract of result["contracts"]) {
            if (contract["address"] == tenderlyEvent.contract_address) {
              tenderlyEvent["token_name"] = contract["token_data"]?.["name"];
              tenderlyEvent["token_symbol"] =
                contract["token_data"]?.["symbol"];
            }
          }
          outputTransactions.push(tenderlyEvent);
        }
      }

      res.send(
        // ResponeObject
        {
          success: "true",
          simulation: {
            date: new Date().getTime(),
            result: true,
            events: outputTransactions,
          },
        }
      );
    } catch (e) {
      console.log(e);

      res.send({ success: "error", date: new Date().getTime(), error: e });
    }
  } else if (website.includes("https://polygonscan.com")) {
    try {
      const transactionResponse = await axios.get(
        "https://api.covalenthq.com/v1/137/transaction_v2/0x83a101ef5169065ace287dd3f9bcb310399625061729927c6f48d8ce4a086004/?key=ckey_4eedbaa09c43419684330b56133"
      );
      // res.send(transactionResponse.data?.data?.items?.[0]?.log_events);

      const result = transactionResponse.data?.data?.items?.[0]?.log_events;

      res.send(
        // ResponeObject
        {
          success: "true",
          simulation: {
            date: new Date().getTime(),
            result: true,
            events: [
              {
                contract_address: "0x1871464f087db27823cff66aa88599aa4815ae95",
                function_name: "Transfer",
                from: "0x163adc0485ba132819e9fca6e354da56d0f93f1b",
                to: "0x3f63ac7588a9358be11ca5e4a0e21772819be40d",
                tokenId: "1543124",
                text: "you swapped 1 Matic For 1 Galaxy NFT",
              },
            ],
          },
        }
      );
      // res.send({
      //   response:
      //     transactionResponse.data?.data?.items?.[0]?.log_events?.[0]?.decoded,
      // });
      // let result = transactionResponse.response;

      // // const ResponeObject = await TransactionReadFunction(result);

      // const dangerousEvents = ["Transfer", "Approval", "ApprovalForAll"];

      // var outputTransactions = [];

      // const events =
      //   result["transaction"]["transaction_info"]["call_trace"]["logs"];
      // for (const event of events) {
      //   if (dangerousEvents.includes(event["name"])) {
      //     var tenderlyEvent = {
      //       contract_address: event["raw"]["address"],
      //       function_name: event["name"],
      //       from: event["inputs"][0]["value"],
      //       to: event["inputs"][1]["value"],
      //       tokenId: event["inputs"][2]["value"],
      //     };
      //     for (const contract of result["contracts"]) {
      //       if (contract["address"] == tenderlyEvent.contract_address) {
      //         tenderlyEvent["token_name"] = contract["token_data"]?.["name"];
      //         tenderlyEvent["token_symbol"] = contract["token_data"]?.["symbol"];
      //       }
      //     }
      //     outputTransactions.push(tenderlyEvent);
      //   }
      // }

      // res.send(
      //   // ResponeObject
      //   {
      //     success: "true",
      //     simulation: {
      //       date: new Date().getTime(),
      //       result: true,
      //       events: outputTransactions,
      //     },
      //   }
      // );
    } catch (e) {
      console.log(e);

      res.send({ success: "error", date: new Date().getTime(), error: e });
    }
  }
});

app.post("/covalent", async (req, res) => {
  // const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  // await delay(3000);
  try {
    const transactionResponse = await axios.get(
      "https://api.covalenthq.com/v1/137/transaction_v2/0x83a101ef5169065ace287dd3f9bcb310399625061729927c6f48d8ce4a086004/?key=ckey_4eedbaa09c43419684330b56133"
    );
    // res.send(transactionResponse.data?.data?.items?.[0]?.log_events);

    const result = transactionResponse.data?.data?.items?.[0]?.log_events;

    res.send(
      // ResponeObject
      {
        success: "true",
        simulation: {
          date: new Date().getTime(),
          result: true,
          events: [
            {
              contract_address: "0x1871464f087db27823cff66aa88599aa4815ae95",
              function_name: "Transfer",
              from: "0x163adc0485ba132819e9fca6e354da56d0f93f1b",
              to: "0x3f63ac7588a9358be11ca5e4a0e21772819be40d",
              tokenId: "1543124",
              text: "you swapped 1 Matic For 1 Galaxy NFT",
            },
          ],
        },
      }
    );
    // res.send({
    //   response:
    //     transactionResponse.data?.data?.items?.[0]?.log_events?.[0]?.decoded,
    // });
    // let result = transactionResponse.response;

    // // const ResponeObject = await TransactionReadFunction(result);

    // const dangerousEvents = ["Transfer", "Approval", "ApprovalForAll"];

    // var outputTransactions = [];

    // const events =
    //   result["transaction"]["transaction_info"]["call_trace"]["logs"];
    // for (const event of events) {
    //   if (dangerousEvents.includes(event["name"])) {
    //     var tenderlyEvent = {
    //       contract_address: event["raw"]["address"],
    //       function_name: event["name"],
    //       from: event["inputs"][0]["value"],
    //       to: event["inputs"][1]["value"],
    //       tokenId: event["inputs"][2]["value"],
    //     };
    //     for (const contract of result["contracts"]) {
    //       if (contract["address"] == tenderlyEvent.contract_address) {
    //         tenderlyEvent["token_name"] = contract["token_data"]?.["name"];
    //         tenderlyEvent["token_symbol"] = contract["token_data"]?.["symbol"];
    //       }
    //     }
    //     outputTransactions.push(tenderlyEvent);
    //   }
    // }

    // res.send(
    //   // ResponeObject
    //   {
    //     success: "true",
    //     simulation: {
    //       date: new Date().getTime(),
    //       result: true,
    //       events: outputTransactions,
    //     },
    //   }
    // );
  } catch (e) {
    console.log(e);

    res.send({ success: "error", date: new Date().getTime(), error: e });
  }
});

app.listen(PORT, () => {
  console.log("the app is running on locahost " + PORT);
});
