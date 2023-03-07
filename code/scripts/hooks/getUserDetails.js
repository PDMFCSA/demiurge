async function getUserDetails() {
  try {
    const response = await fetch("./api-standard/user-details");
    let jsonResult = await response.json();
    let returnResult = jsonResult.username.replace(/@/gm, '/');
    const openDSU = require("opendsu");
    const config = openDSU.loadAPI("config");
    let appName = await $$.promisify(config.getEnv)("appName");
    return {
      userAppDetails: `${appName || "-"}/${returnResult}`,
      userName: jsonResult.username
    }
  } catch (err) {
    console.error(`Failed to get user's details`, err);
    window.disableRefreshSafetyAlert = true;
    alert("Wallet has issues. Will try to fix it.")
    const basePath = window.location.href.split("loader")[0];
    window.location.replace(basePath + "loader/newWallet.html");
  }
}

export {getUserDetails};
