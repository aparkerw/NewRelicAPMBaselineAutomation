import NerdGraphService from "./NerdGraphService.js";


/**
 * Function that wraps the creation of all alert related entities needed for
 * the proper monitoring of an APM instance.
 * 
 * This function intends to create an email destinataion and will look for an existing
 * email destination for baseline alerting. Emails with the same value but not marked with the
 * Baseline=true tag will not be re-used.
 * 
 * Likewise, channels, policies and workflows will all be skipped if they already exist.
 * Primarily checks look for the Baseline=true and BASELINE_APM_GUID=****** to match what this
 * run is trying to create
 */
const setupBaselineAlerting = async (accountId, email, apmName, apmGuid) => {
  // 1 find/create destination
  // 2 find/create channel
  // 3 find/create conditions
  // 4 find/create policy
  // 5 find/create workflow


  let [destinationId, channelId] = await createDestinationAndChannel(accountId, email);
  console.log("destinationId", destinationId);
  console.log("channelId", channelId);
  let policyId = await createAlertPolicy(accountId, apmName);
  console.log("policyId", policyId);
  let conditionIds = await createAlertConditions(accountId, apmName, apmGuid, policyId);
  console.log("conditionIds", conditionIds.join(', '));
  let workflowId = await createWorkflow(accountId, channelId, policyId, apmName, apmGuid);
  console.log("workflowId", workflowId);
}

/**
 * Creates an email destination for the address specified unless it already exists.
 * Attaches a channel to the destination if the destination is created.  If the destination exists
 * but the channel is missing then a new channel will be created.
 */
const createDestinationAndChannel = async (accountId, email) => {

  let [destinationId, channelId] = await loadExistingBaselineDestinationAndChannel(accountId, email);

  // if we don't have a baseline destination, then make one
  if (!destinationId) {
    destinationId = await createDestination(accountId, email);
  }
  // if we don't have a baseline channel for the destination then
  if (!channelId) {
    channelId = await createChannel(accountId, destinationId);
  }

  return [destinationId, channelId];
}

/**
 * Look for destinations for this email with the Baseline=true tag.
 * If we find a destination then we'll try to get the first associated channel.
 */
const loadExistingBaselineDestinationAndChannel = async (accountId, email) => {
  let destinationId, channelId;
  let existingDestination = await NerdGraphService.makeCall({
    query: `{
    actor {
      account(id: ${accountId}) {
        aiNotifications {
          destinations(
            filters: {name: "${makeDestinationName(email)}", property: {key: "email", value: "${email}"}}
          ) {
            entities {
              id
              guid
              properties {
                displayValue
                key
                label
                value
              }
              name
            }
          }
        }
      }
    }
  }`});

  // we just grab the first destination that looks like a baseline for that email
  destinationId = existingDestination.data?.data?.actor?.account?.aiNotifications?.destinations?.entities[0]?.id;

  if (destinationId) {
    let existingChannel = await NerdGraphService.makeCall({
      query: `{
        actor {
          account(id: ${accountId}) {
            aiNotifications {
              channels(filters: {active: true, destinationId: "${destinationId}"}) {
                entities {
                  id
                  name
                  destinationId
                }
              }
            
            }
          }
        }
      }`});
    channelId = existingChannel.data?.data?.actor?.account?.aiNotifications?.channels?.entities[0]?.id;
  }

  return [destinationId, channelId];
}

// common function for standardizing destination name during create/lookup
const makeDestinationName = (email) => {
  return `${email} - Baseline`;
}

/**
 * creates an email destination for the given email and adds tags
 */
const createDestination = async (accountId, email) => {

  let graphql = {
    query: `mutation {
    aiNotificationsCreateDestination(
      accountId: ${accountId}
      destination: {
        type: EMAIL
        name: "${makeDestinationName(email)}"
        properties: [{ key: "email", value: "${email}" }]
      }
    ) {
      destination {
        id
        guid
      }
    }
  }`};

  let resp = await NerdGraphService.makeCall(graphql);

  let errors = resp.data.errors || [];
  if (errors.length > 0) {
    for (let error of errors) {
      console.log(error.message);
    }
  }

  let destinationId = resp.data.data?.aiNotificationsCreateDestination?.destination?.id;
  let destinationGuid = resp.data.data?.aiNotificationsCreateDestination?.destination?.guid;
  await NerdGraphService.addTagsToEntity(destinationGuid, [
    { key: "BASELINE", values: "true" }
  ]);
  return destinationId;

}

/**
 * creates a channel attached to the provided destinationId
 */
const createChannel = async (accountId, destinationId) => {

  let graphql = {
    query: `mutation {
    aiNotificationsCreateChannel(
      accountId: ${accountId}
      channel: {
        type: EMAIL
        name: "Baseline Channel"
        destinationId: "${destinationId}"
        product: IINT
        properties: []
      }
    ) {
      channel {
        id
      }
    }
  }`};

  let resp = await NerdGraphService.makeCall(graphql);


  let errors = resp.data.errors || [];
  if (errors.length > 0) {
    for (let error of errors) {
      console.log(error.message);
    }
  }


  return resp.data.data?.aiNotificationsCreateChannel?.channel?.id;

}

/**
 * creates an alert policy that conditions can be attached to.
 * this will look for an existing policy with matching policy name to the baseline
 * naming convention
 */
const createAlertPolicy = async (accountId, apmName) => {

  // check for existing policies
  let policyId = await checkForExistingAlertPolicy(accountId, apmName)

  if (policyId) {
    console.log('skipping policy creation because matching policy already exists:', policyId);
  } else {
    console.log(`creating new policy for '${apmName}'`);
    let graphql = {
      query: `mutation {
      alertsPolicyCreate(
        accountId: ${accountId}
        policy: {incidentPreference: PER_CONDITION, name: "${makeAlertPolicyName(apmName)}"}
      ) {
        id
      }
    }`};

    let resp = await NerdGraphService.makeCall(graphql);

    policyId = resp.data.data?.alertsPolicyCreate?.id;
  }

  return policyId;
}

/**
 * Looks to find the first policy with a matching policy name
 */
const checkForExistingAlertPolicy = async (accountId, apmName) => {

  let resp = await NerdGraphService.makeCall({
    query: `{
    actor {
      account(id: ${accountId}) {
        alerts {
          policiesSearch(searchCriteria: {name: "${makeAlertPolicyName(apmName)}"}) {
            policies {
              id
            }
          }
        }
      }
    }
  }`})

  let existigPolicyId = resp.data.data?.actor?.account?.alerts?.policiesSearch?.policies[0]?.id;
  return existigPolicyId;
}

/**
 * function to standardize the policy naming for creation/lookup
 */
const makeAlertPolicyName = (appName) => {
  return `Baseline - ${appName}`;
}



// TODO: make this more dynamic with each query being processed to make all of the conditions
// required for the application
const createAlertConditions = async (accountId, apmName, apmGuid, policyId) => {

  let conditionIds = [];
  let alertConditions = [
    {
      name: 'hosts check',
      query: `SELECT uniqueCount(host) FROM Transaction WHERE entity.guid='${apmGuid}'`
    },
    {
      name: 'hosts check 2',
      query: `SELECT uniqueCount(host) FROM Transaction WHERE entity.guid='${apmGuid}'`
    }
  ]
  for (let condition of alertConditions) {

    // check for an existing condition
    let existingConditions = await checkForExistingCondition(accountId, apmName, condition.name, condition.query);

    if (existingConditions.length > 0) {
      console.log("condition being skipped", condition.name, existingConditions.map(c => c.id).join(','));
    } else {
      let graphql = {
        query: `mutation {
      alertsNrqlConditionStaticCreate(
        accountId: ${accountId}
        policyId: "${policyId}"
        condition: {
          name: "Baseline - ${apmName} - ${condition.name}"
          enabled: true
          nrql: {
            query: "${condition.query}"
          }
          signal: {
            aggregationWindow: 60
            aggregationMethod: EVENT_FLOW
            aggregationDelay: 120
          }
          terms: {
            threshold: 2
            thresholdOccurrences: AT_LEAST_ONCE
            thresholdDuration: 600
            operator: BELOW
            priority: CRITICAL
          }
          valueFunction: SINGLE_VALUE
          violationTimeLimitSeconds: 86400
        }
      ) {
        id
        entityGuid
        name
      }
    }`};

      let resp = await NerdGraphService.makeCall(graphql);

      let errors = resp.data.errors || [];
      if (errors.length > 0) {
        for (let error of errors) {
          console.log(error.message);
        }
      }

      let conditionId = resp.data.data?.alertsNrqlConditionStaticCreate?.id;
      let conditionGuid = resp.data.data?.alertsNrqlConditionStaticCreate?.entityGuid;

      await NerdGraphService.addTagsToEntity(conditionGuid, [
        { key: "BASELINE", values: "true" },
      ]);

      conditionIds.push(conditionId);
    }
  }

  return conditionIds;

}

/**
 * 
 */
const checkForExistingCondition = async (accountId, apmName, conditionName, conditionQuery) => {

  let query = {
    query: `{
  actor {
    account(id: ${accountId}) {
      alerts {
        nrqlConditionsSearch(
          searchCriteria: {name: "Baseline - ${apmName} - ${conditionName}", query: "${conditionQuery}"}
        ) {
          nextCursor
          nrqlConditions {
            id
            name
            nrql {
              dataAccountId
              evaluationOffset
            }
          }
        }
      }
    }
  }
}`};
  let resp = await NerdGraphService.makeCall(query);

  let conditions = resp.data?.data?.actor?.account?.alerts?.nrqlConditionsSearch?.nrqlConditions || [];

  return conditions;
}

/**
 * Function to create a workflow that is attached to the policy created for the given APM.
 * If an existing workflow exists with the BASELINE_AMP_GUID=*** tag matching then we will use 
 * that workflow instead
 */
const createWorkflow = async (accountId, channelId, policyId, apmName, apmGuid) => {

  // TODO: check for existing workflow
  let workflowGuid = await checkForExistingWorkflow(apmGuid);

  if (workflowGuid) {
    console.log('skipping workflow creation because matching workflow already exists:', workflowGuid);
  } else {
    let graphql = {
      query: `mutation {
      aiWorkflowsCreateWorkflow(
        accountId: ${accountId}
        createWorkflowData: {
          destinationConfigurations: {
            channelId: "${channelId}"
          }, 
          destinationsEnabled: true, 
          name: "BaselineAlert - ${apmName}", 
          workflowEnabled: true, 
          issuesFilter: {
            type: FILTER,
            predicates: [
              {
                attribute: "labels.policyIds",
                operator: EXACTLY_MATCHES,
                values: "${policyId}"
              }
            ]
          }
          mutingRulesHandling: DONT_NOTIFY_FULLY_MUTED_ISSUES}
      ) {
        errors {
          description
          type
        }
        workflow {
          id
          guid
        }
      }
    }`};

    let resp = await NerdGraphService.makeCall(graphql);

    let errors = resp.data.data?.aiWorkflowsCreateWorkflow?.errors || [];
    if (errors.length > 0) {
      for (let error of errors) {
        console.log(error.description);
      }
    }



    workflowGuid = resp.data.data?.aiWorkflowsCreateWorkflow?.workflow?.guid;

    // Add tags to enrich the workflow for easy management
    await NerdGraphService.addTagsToEntity(workflowGuid, [
      { key: "BASELINE", values: "true" },
      { key: "BASELINE_APM_NAME", values: apmName },
      { key: "BASELINE_APM_GUID", values: apmGuid },
    ]);
  }

  return workflowGuid;

}

/**
 * Function check for an existing workflow with the BASELINE_AMP_GUID=*** tag matching 
 */
const checkForExistingWorkflow = async (apmGuid) => {
  let existingWorkflow = await NerdGraphService.getEntitiesFromQuery(`tags.Baseline = 'true' AND tags.BASELINE_APM_GUID = '${apmGuid}' AND type IN ('WORKFLOW')`) || [];
  return existingWorkflow[0]?.guid;
}

export default { setupBaselineAlerting };


/* 
and to delete

mutation {
  aiNotificationsDeleteChannel(
    accountId: 3914962
    channelId: "6cfb452d-****-c1aa8c54245b"
  ) {
    ids
    error {
      description
      details
      type
    }
  }
}
*/