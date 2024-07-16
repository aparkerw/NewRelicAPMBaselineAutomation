import axios from "axios";

const headers = () => {
  return {
    "API-Key": process.env.NR_API_KEY,
    "Content-Type": "application/json",
    Accept: 'application/json',
    'Accept-Charset': 'utf-8',
    "Access-Control-Allow-Origin": "http://localhost:3000/",
    "Access-Control-Allow-Methods": "POST",
    "charset": "UTF-8",
  };
}

const getAccounts = async () => {
  var graphql = { query: "{\n  actor {\n    accounts {\n      id\n      name\n   reportingEventTypes\n    }\n  }\n}", variables: null };
  let resp = await makeCall(graphql);
  return resp?.data?.data?.actor?.accounts;
}

const getEntityGuidFromName = async (entityName, accountId, type) => {
  // entitySearch(queryBuilder: {name: "${entityName}" ${type ? `, type: ${type}` : ''}}) {
  let entities = await getEntitiesFromQuery(`name = '${entityName}' and accountId = ${accountId}`)

  if(entities.length > 1) {
    throw Error(`There are too many entities with that name. ${entities.map(e => e.guid).join(', ')}`);
  } else if(!entities || entities.length === 0) {
    throw Error("Entities with that name could not be found.");
  }
  return entities[0]?.guid;
}

const getEntitiesFromQuery = async (query) => {
  // entitySearch(queryBuilder: {name: "${entityName}" ${type ? `, type: ${type}` : ''}}) {
  var graphql = { query: `{
    actor {
      entitySearch(query: "${query}") {
        results {
          entities {
            guid
            type
            name
          }
        }
        query
      }
    }
  }`};

  let resp = await makeCall(graphql);
  let entities = resp.data?.data?.actor?.entitySearch?.results?.entities;
  return entities;
}

const addTagsToEntity = async (entityGuid, tags) => {
  var graphql = { query: `
    mutation {
      taggingAddTagsToEntity(guid: "${entityGuid}", tags: ${JSON.stringify(tags,null,2).replaceAll('"key"','key').replaceAll('"values"','values')}) {
      errors {
          message
          type
        }
      }
    }`
  };
  // console.log(graphql);

  let resp = await makeCall(graphql);
  // console.log(JSON.stringify(resp.data, null, 2));
}

const addBaselineTags = async (entityGuid, apmName, apmGuid) => {
  await addTagsToEntity(entityGuid, [
    { key: "BASELINE", values: "true" },
    { key: "BASELINE_APM_NAME", values: apmName },
    { key: "BASELINE_APM_GUID", values: apmGuid },
  ]);
}

const makeCall = async (graphql) => {

  var resp = await axios({
    url: 'https://api.newrelic.com/graphql',
    method: 'post',
    headers: headers(),
    data: graphql
  }).catch((e) => {
    console.log('GraphQL alert condition create error:', JSON.stringify(e,null,2));
  });

  return resp;
}

export default { makeCall, getAccounts, addBaselineTags, addTagsToEntity, getEntityGuidFromName, getEntitiesFromQuery };
