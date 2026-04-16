import yahooFinance from "yahoo-finance2";
async function run() {
  const data = await yahooFinance.quote("AAPL");
  console.log(data);
}
run();
