# Amex GBT Observability Standardization Automation

## Overview

The purpose of this terraform project is to provide a standard implementation for alerts and for dashboard creation.

## Output

 _place output here_

## Running the Script

### Environment variables

Your terraform scritpt will need variables set to allow proper execution.  This can be done manually:

```
export TF_VAR_nr_account_id=39....62
export TF_VAR_nr_api_key=NRAK-..........
```

Or you can create a file called `set_env_vars.sh` then give it exection priveledges with `chmod +x set_env_vars.sh` and execute the following command. (this file is in the .gitignore list so it won't be saved to source control)

```
. ./set_env_vars.sh
```

Execute `terraform init` in your terminal.


Run `terrafrom plan`

Run `terraform apply`