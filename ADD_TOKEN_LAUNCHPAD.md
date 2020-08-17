# Adding Token as Default on Launchpad

Switch dex allows any token to be launched by contract address. If you are a project owner and want
to launch your token as default on the Switch Dex, your token needs to pass a voting process where ESH holders will vote if your project is worthy to be presented as default.

If community approves your token you will have follow benefits:

-   Announcement on medium, twitter and all relevant switch channels
-   Token listed on Switch

# Requirements

-   Register as market maker on Switch ZRX pool, and allow a fee 5% of all sales that goes to ESH holders

If the token was approved you need to do a pull request to add your token on the config.json file under src/config/mainnet/config-ieo.json with the following template:

```json
     "tokens": [
         {
            "decimals": 18,
            "symbol": "esh",
            "name": "Switch",
            "primaryColor": "#081e6e",
            "icon": "assets/icons/esh.svg",
            "addresses": {
                "1": "0xd6a55c63865affd67e2fb9f284f87b7a9e5ff3bd",
                "3": "0xba3a79d758f19efe588247388754b8e4d6edda81",
                "42": "0xBA3a79D758f19eFe588247388754b8e4d6EddA81"
            },
            "id": "switch",
            "unified_cryptoasset_id": 3365,
            "displayDecimals": 0,
            "description": "Switch give users the ability to seamlessly 'switch' between other assets, buy gift cards, donate to non-profits, and gamble.",
            "website": "https://switch.ag/",
            "owners": ["0x6BAB128FE1D552646c002577CD6678Ae02a0d903"],
            "feePercentage": "0.05",
            "endDate": "12-15-2019"
        },
     ]
```

and pairs:

```json


 "pairs": [
        {
            "base": "esh",
            "quote": "weth",
            "config": {
                "basePrecision": 0,
                "pricePrecision": 8,
                "minAmount": 10000
            }
        },
```
