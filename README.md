# TrueLayer integration server

## REQUIREMENTS

1. Node.js v10.x.x and npm v6.x.x
2. MySQL v8.x 
3. 

## GLOBAL PACKAGE DEPENDENCIES

1. sails
```sh
npm i -g sails
```


## How to setup application

1. Clone repo
```sh
git clone git@github.com:ivanski1024/emma-sails.git
```

2. Install repo

```sh
cd emma-sails
npm install
```

3. Configure TrueLayer `client_id` and `client_secret` by creating such file: `<porject-directory/config/env/local.js` containing configuration looking like this:

```javascript
module.exports = {
  client_id: '<YOUR CLIENT_ID HERE>',
  client_secret: '<YOUR CLIENT_SECRET HERE>'
};
```

4. Create empty database with your prefered name. Then you need to edit the connection string which is located in `config/datastores.js line 52`. The connection string's signature is such: `'mysql://<user>:<password@<host>:<port>/<db_name>'`

5. Then to run the application type:
```sh
sails lift
```

## USAGE

1. First you need to got to either `http://localhost:1337` or `http://localhost/register`. This will redirect you to TrueLayer's login page.

2. After you authenticate in TrueLayer this will redirect you back to the callback endpoint which after resolving your request will return you your user's id. 

3. To get your transactions just call `http://localhost:1337/transactions?userId=<your_user_id>`

4. To get debug information you can access `http://localhost:1337/debugInformation?userId=<your_user_id>` and pass the userId again.