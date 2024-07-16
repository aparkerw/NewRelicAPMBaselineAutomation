# APM Observability Standardization Automation

## Overview

The purpose of this project is to provide a standard implementation for the creation of alerts, dashboards, and other governance resources/attributes.

Executing this script for each APM instance in your account will ensure that any standardized alerting and dashboard governance policies are applied.

This script is idempotent and will only create resources that haven't been created or have otherwise been removed.

Note the use of tagging for these resources.  Particularly the `BASLEINE=true` tag applied to items created within.

Likewise the APM entity that this is executed upon will have the following tags added to it for the purposes of auditing and cross linking.

- `BASELINE_DASHBOARD_CREATED={date_of_creation}`
- `BASELINE_DASHBOARD_GUID={GUID_of_dashboard}`
- `BASELINE_WORKFLOW_CREATED={date_of_creation}`
- `BASELINE_WORKFLOW_GUID={GUID_of_workflow}`

## Graphql

### Description

Graphql is the most flexible option for creating resources withing New Relic and it allows us to fully control the logic for handling existing resources.

The **NodeJS** script in `app.js` will use the provided environment variables to then lookup and create the additional alerting and dashboard resources.

#### Results

When the script executes it will create the following artifacts if they do not exist:

- Dashboards: dashboard with desired pages/widgets
- Alerts: destination for the provided email
- Alerts: channel for the destination
- Alerts: alert policy with incident handeling rules
- Alerts: alert condition(s) that will be added to the policy
- Alerts: alert workflow that links the channel and the alert policy



### Running the script

To run this script you will need to have **NodeJS** and **npm**installed on the system.

Update the application dependencies by calling `npm i` from within the `GraphQL` folder.

You can either create the `.env` file as described below, or copy the `.env.template` file and add your credentials or you can define the environment vairables in the shell or inline (see examples below).

Once installed you can run the following command from the `GraphQL` directory:

with a `.env` file

```
cd GraphQL
node app.js
```

```
cd GraphQL
npm i
export NR_API_KEY="NRAK-L*******************5"
export NR_APP_NAME="Account Management Service"
export NR_ACCOUNT_ID="1234567"
export NR_ALERT_EMAIL="your_email@email.com"
node app.js
```
or inline

```
cd GraphQL
NR_API_KEY="NRAK-L*******************5" NR_APP_NAME="Account Management Service" NR_ACCOUNT_ID="1234567" NR_ALERT_EMAIL="your_email@email.com" node app.js
```




#### Inputs

To properly run the script you will need to provide the following information either in a `.env` file or as an `Envoronment Variable`

- **New Relic Account ID** - the account to create dashboards and alerts in
- **API Key** - requried for retrieving and creating resources in your account
- **APM Name** - the name of the application to be monitored, this is likely already in your APM configuratin files
- **Alert Email Address** - the email address that is the destination for receiving alert messages

*example `.env`file*
```
NR_API_KEY="NRAK-L*******************5"
NR_APP_NAME="Account Management Service"
NR_ACCOUNT_ID="1234567"
NR_ALERT_EMAIL="your_email@email.com"
```

Additionally, to meet your specific requirements, the dashboard content/layout can be adjusted by modifying the `createDashboard()` method in `GraphQL/services/DashboardService.js`.  You can add new pages or widgets and you can update the NRQL queries to meet your needs.

For alerts customization.  You can update the policy's alerting logic in 

#### Outputs

The logs will display information about the skipping or creating of resources.
Likewise, the IDs and GUIDs for the resulting artifacts will be shown in the logs.

Here is an example output:

```
The baseline dashboard appears to already exist. MzkxNDk2M****zQ4MzQ
creating the baseline dashboard was not successful Dashboard already exists...aborting.
destinationId 2856b**-****-****9a2a26ea
channelId 04fc90b4-****-0b7af513a3b8
skipping policy creation because matching policy already exists: 54***73
policyId 5465973
condition being skipped hosts check 111***11
condition being skipped hosts check 2 222***22
conditionIds 
skipping workflow creation because matching workflow already exists: MzkxNDk2MnxBS***TcwMC1hNTFhNTllY2YyYzM
workflowId MzkxNDk2MnxBS***TcwMC1hNTFhNTllY2YyYzM
```

#### Logic

The basics of the logia are as follows:
1. look up the entity GUID from the APM name (abort if the match is not exactly 1 entity)
1. check for existing dashboard (tags + name), create if missing with queries pointing to the entity GUID retrieved earlier
1. check for destination (name + email), create if missing using provided email
1. check for channel, create if missing
1. check for alert policy (tags + name), create if missing
1. check for alert conditions (name + query), create if missing and add to policy
1. check for workflow (tags + name), create if missing and attach channel and policy



## Terraform

### Description

Terraform can be another solution for codifying this work and it will be expanded and explained further in future updates.