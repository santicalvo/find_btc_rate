### find_btc_rate 

This is a simple script to save the bitcoin rate to a mysql database.
The script simply makes a call to this service and saves the data:

http://api.coindesk.com/v1/bpi/currentprice.json

Usage:

```
node find_btc_rate.js
```

I got it working with a cronjob that runs each time I boot.