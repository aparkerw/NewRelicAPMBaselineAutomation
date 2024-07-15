import NerdGraphService from "./NerdGraphService.js";

const createDashboard = async (accountId, apmName, apmGuid, dashboardName) => {

  let existingDashboard 

  let graphql = { query: `mutation {
    dashboardCreate(
      accountId: ${accountId}
      dashboard: {
        description: "Dasboard description here" 
        permissions: PUBLIC_READ_ONLY
        name: "${dashboardName}" 
        pages: {
          description: "Dashboard to normalize reporting for applications." 
          name: "Page 1", widgets: [
            {
              configuration: 
                { 
                  markdown: {
                    text: "# Baseline Dashboard for ${apmName}"
                }
              }
              layout: {
                width: 12
                height: 1
                column: 1
                row: 1
              }
            }
            {
              configuration: 
                { 
                  markdown: { text: "## Description\\nThe purpose of this dashboard is to show 1,2,3..."
                }
              }
              layout: {
                width: 12
                height: 1
                column: 1
                row: 2
              }
            }
            {
              title: "Throughput 30 minutes"
              linkedEntityGuids: ["${apmGuid}"]
              configuration: 
                { 
                  billboard: {
                    nrqlQueries: {
                      query: "SELECT rate(count(apm.service.transaction.duration), 1 minute) as 'Web throughput' FROM Metric WHERE (entity.guid = '${apmGuid}') AND (transactionType = 'Web') LIMIT MAX SINCE 30 minutes ago TIMESERIES UNTIL now ", 
                      accountId: ${accountId}
                  }
                }
              }
              layout: {
                width: 4
                height: 3
                column: 1
                row: 3
              }
            }
            {
              title: "Throughput 30 minutes"
              linkedEntityGuids: ["${apmGuid}"]
              configuration: 
                { 
                  line: {
                    nrqlQueries: {
                      query: "SELECT rate(count(apm.service.transaction.duration), 1 minute) as 'Web throughput' FROM Metric WHERE (entity.guid = '${apmGuid}') AND (transactionType = 'Web') LIMIT MAX SINCE 30 minutes ago TIMESERIES UNTIL now ", 
                      accountId: ${accountId}
                  }
                }
              }
              layout: {
                width: 8
                height: 3
                column: 5
                row: 3
              }
            }]
          }
      }
    )
    {
      errors {
        description
      }
      entityResult {
        guid
      }
    }
  }`};
  // console.log(graphql);

  let resp = await NerdGraphService.makeCall(graphql);

  // console.log(JSON.stringify(resp.data.data, null, 2));

  return resp.data.data?.dashboardCreate?.entityResult?.guid;
}

const createDashbaordForAPM = async (accountId, apmName, apmGuid) => {

  let dashboardName = `Baseline - ${apmName}`;

  // this will check for existing baseline dashboards and will throw 
  // an exception if a dashboard already exists already exists
  await validateBaselineDashboardIsUnique(apmGuid);
  

  // if the dashboard is unique then we will 
  let dashboardGuid = await createDashboard(accountId, apmName, apmGuid, dashboardName);
  await NerdGraphService.addBaselineTags(dashboardGuid, apmName, apmGuid);
  let d = new Date();
  await NerdGraphService.addTagsToEntity(apmGuid, [
     {key: "BASELINE_DASHBOARD_CREATED", values: `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`},
     {key: "BASELINE_DASHBOARD_GUID", values: `${dashboardGuid}`}
  ])
  5
  return null;
}

const validateBaselineDashboardIsUnique = async (apmGuid) => {
    // TODO: check for existance before proceeding (maybe use tags instead of name: BASELINE_DASHBOARD_GUID / apmGuid)
    let existingDashboards = [];
    try {
      existingDashboards = await NerdGraphService.getEntitiesFromQuery(`tags.Baseline = 'true' AND tags.BASELINE_APM_GUID = '${apmGuid}' AND type IN ('DASHBOARD')`) || []
    } catch (e) { 
      // eat the error if the entity cannot be found since that is normal
    }
  
    if (existingDashboards.length > 0) {
      console.warn('The baseline dashboard appears to already exist.', existingDashboards.map(d => d.guid).join(','));
      throw Error("Dashboard already exists...aborting.");
    }
}


export default { createDashbaordForAPM };
