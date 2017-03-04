# sandbox-server for trycoding.io

## Install
1. Install [sourcebox-sandbox](https://github.com/waywaaard/sourcebox-sandbox) (see `INSTALL.md`) for detailed instructions.
2. `npm install https://github.com/waywaaard/sandbox-server`
3. `npm install -g pm2`
4. By default the server starts on port `80`. If you are using `nginx` you need to change that. It is possible to use a `production.json` configuration that is loaded when the `production` env is set. It gets automatically merged with the default configuration options.
5. Change the authentication secret and generate yourself a password for the local storage to access (*"use"*) the test page (see below for further instructions)

## Start Server
Start the server with: `sudo pm2 start process.json --env production`

### Debugging
Start the server with `sudo DEBUG=sourcebox:* pm2 start process.json --env production` to get all the debug outputs on the console.


## Testpage

The sandbox server serves a simple testpage on port 80. See options. You can disable the testpage by setting `serverStatic: false`.
In order to access the server you need to generate yourself a valid password token and set it on your local storage.

Example password in the browser console:
```
localStorage.password = "eyJhbGciOiJIUzI1NiJ9.ZGlkaXRmb3J0aGVsdWx6.CMb8-OxIFLoXfTwdT21fqIVlqIA7jfeklLgiwu2xUHg"
```

Use the `jsonwebtoken` package and create yourself a token by `jwt.sign(PW, SECRET)` and use the above line to set it in your browser. You may use
https://runkit.com/npm/jsonwebtoken as a fast way of creating one.

## Troubleshooting
If the test server fails with and internal error due to failed to set cgroup memory limit, then you need to follow these steps:

1. Add `cgroup_enable=memory swapaccount=1` to `GRUB_CMDLINE_LINUX_DEFAULT` in `/etc/default/grub`
2. Run `update-grub`
3. Reboot the server
4. Restart/Start server and try again