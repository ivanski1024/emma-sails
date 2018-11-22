# REQUIREMENTS

1. Node.js v10.x.x and npm v6.x.x
2. MySQL v8.x 
3. 



#How to setup application

1. Clone repo
` git clone git@github.com:ivanski1024/emma-sails.git`

2. Install repo

```
cd emma-sails
npm install
```

3. Configure TrueLayer `client_id` and `client_secret` by creating such file: `<porject-directory/config/env/local.js` containing configuration looking like this:

```
module.exports = {
  client_id: '<YOUR CLIENT_ID HERE>',
  client_secret: 'YOUR CLIENT_SECRET HERE'
};
```

4. 