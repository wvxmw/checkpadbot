const { Telegraf, Markup } = require("telegraf");
const fetch = require("node-fetch");
const timestampToDate = require("timestamp-to-date");
require("dotenv").config();
const bot = new Telegraf(process.env.BOT_TOKEN);

const contract_address = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const mainChatId = "-1002253121294";

const lastTs = {
   get: "",
   send: "",
};

const padWallet = {
   address: "TAVU6HYWn5Rh85DqEcXTRLLXUt8eA34hCo",
   deposit: {
      id: "",
      timeStamp: "",
      infoText: "прокладки",
      subFile: "padsubscribers.json",
      minAmount: 1000,
      showFrom: false,
   },
   out: {
      id: "d07a76b82cf2fbbe0a6b865a12918ad03fc8a748a991a5e66e44a27a07285ec1",
      timeStamp: "",
      infoText: "прокладки",
      subFile: "padoutsubscribers.json",
      minAmount: 1000,
   },
   signs: "🟠🟠🟠🟠🟠",
};

(async () => {
   while (true) {
      await checkOut(padWallet);
      // console.log("----------------------------------------------------------");
   }
})();

async function checkOut(wallet) {
   // console.log(`Последнее ID вывода с ${wallet.out.infoText} ${wallet.out.id}`);
   // console.log(
   //    `Последнее время вывода с ${wallet.out.infoText} ${
   //       wallet.out.timeStamp &&
   //       timestampToDate(wallet.out.timeStamp, "dd.MM.yyyy HH:mm:ss")
   //    }`
   // );
   await fetch(
      `https://api.trongrid.io/v1/accounts/${wallet.address}/transactions/trc20?limit=20&contract_address=${contract_address}&min_timestamp=${wallet.out.timeStamp}&only_from=true`
   )
      .then((response) => response.json())
      .then(async (data) => {
         const outs = data.data;
         if (wallet.out.id !== "" && outs.length > 0) {
            if (wallet.out.id !== outs[0].transaction_id) {
               lastTs.get = Date.now();
               let maxI = outs.length - 1;
               for (let i = 0; i < outs.length; i++) {
                  if (outs[i].transaction_id === wallet.out.id) {
                     maxI = i - 1;
                  }
               }
               for (let i = maxI; i >= 0; i--) {
                  const transferAmount = editedValue(outs[i].value);
                  if (
                     outs[i].transaction_id !== wallet.out.id &&
                     transferAmount >= wallet.out.minAmount && outs[i].to === "TNFm9JdGoj58wnkos742obF8mN4Xcm5n6X"
                  ) {
                     await bot.telegram.sendMessage(
                        mainChatId,
                        `${wallet.signs && wallet.signs + "\n"}Новый вывод с ${
                           wallet.out.infoText
                        }\nСумма: ${stringValue(
                           editedValue(outs[i].value)
                        )}\nВремя: ${timestampToDate(
                           outs[i].block_timestamp,
                           "HH:mm:ss"
                        )}`
                     );
							lastTs.send = Date.now();
                  }
               }
               wallet.out.id = outs[0].transaction_id;
               wallet.out.timeStamp = outs[0].block_timestamp;
            }
         } else {
            if (outs.length > 0) {
               wallet.out.id = outs[0].transaction_id;
               wallet.out.timeStamp = outs[0].block_timestamp;
            }
         }
         // if (outs) {
         //    for (let i = 0; i < outs.length; i++) {
         //       console.log(`${i + 1}. ${outs[i].transaction_id}`);
         //    }
         // }
      })
      .catch((error) => console.error(error));
   // console.log(" ");
}

bot.on("message", async (ctx) => {
   if (!ctx.message.text) return;
   if (ctx.message.text.trim() === "/zxcvbn") {
      await ctx.reply("!");
   } else if (ctx.message.text.trim() === "/checktimepad") {
      await ctx.reply(
         `Получено: ${timestampToDate(lastTs.get, "HH:mm:ss")}.${new Date(
            lastTs.get
         ).getMilliseconds()}\nОтправлено: ${timestampToDate(
            lastTs.send,
            "HH:mm:ss"
         )}.${new Date(lastTs.send).getMilliseconds()}`
      );
   }
});
bot.launch();

function editedValue(value, decimalPlaces = 0) {
   return (value / 1000000).toFixed(decimalPlaces);
}

function stringValue(value) {
   return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
