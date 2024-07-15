import "dotenv/config.js";
import NerdGraphService from "./services/NerdGraphService.js";
import DashboardService from "./services/DashboardService.js";
import AlertsService from "./services/AlertsService.js";



const main = async () => {

  let nr_account_id = process.env.NR_ACCOUNT_ID;
  let nr_api_key = process.env.NR_API_KEY;
  let nr_alert_email = process.env.NR_ALERT_EMAIL;
  let nr_app_name = process.env.NR_APP_NAME;

  let accounts = await NerdGraphService.getAccounts();
  // console.log(accounts);

  // get application information from new relic
  let nr_entity_guid = await NerdGraphService.getEntityGuidFromName(nr_app_name, 'APPLICATION');


  if (nr_account_id && nr_app_name && nr_entity_guid) {
    // create a baseline dashboard if one does not already exist
    try {
      let dashboardId = await DashboardService.createDashbaordForAPM(nr_account_id, nr_app_name, nr_entity_guid);
      console.log(`created dashboard, ${dashboardId}`)
    } catch (e) {
      console.warn("creating the baseline dashboard was not successful", e.message)
    }
  } else {
    console.warn('dashboard creation because some data was missing, accountId, appName, entityGuid');
  }



  // create baseline alert(s) for the APM
  await AlertsService.setupBaselineAlerting(nr_account_id, nr_alert_email, nr_app_name, nr_entity_guid)
}

main();