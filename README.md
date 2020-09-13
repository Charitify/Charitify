
# Charitify - app for helping those in need.

* [Table of contents:](#table-of-contents-)
  * [🗃 Server structure](#-server-structure)
    + [🛤 Routes](#-routes)
    + [🖇 Middlewares](#-middlewares)
    + [🕹️ Controllers](#--controllers)
    + [⚙️ Services](#-services)
    + [🗄️ Models](#--models)
    + [📋 Config](#-config)
    + [🛠 Utils](#-utils)
  * [🧰 Project installation](#-project-installation)
  * [🏃 Run the project](#-run-the-project)
    + [Run app in a dev mode](#run-app-in-a-dev-mode)
    + [Run an app with production config](#run-an-app-with-production-config)
    + [Build app ready for production](#build-app-ready-for-production)
    + [Run production build](#run-production-build)
  * [📤 Deployment](#-deployment)
    + [Simplified deploy steps](#simplified-deploy-steps)
  * [👨‍💻 Monitoring](#-monitoring)
  * [🛡 Security](#-security)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>

## 🗃 Server structure
Server executing sarts with `src/server.js` file. Here we launch express and initialize all needed utils. The rest 'trinkets' are inside `/src/server` folder. Directories there are structured in this way:
### 🛤 Routes
Here are stored routes of the app that may use middlewares to validate session, or payload and controllers to process request.
### 🖇 Middlewares
Here express middlewares take their place. They are used to process the incoming requests before handling them down to the controllers. Usually they use passport, joi as a payload validators.
### 🕹️ Controllers
Think of controllers as "orchestrators". They call the services, which contain more "pure" business logic. But by themselves,controllers don't really contain any logic other than handling the request and calling services. The services do most of the work, while the controllers orchestrate the service calls and decide what to do with the data returned.
### ⚙️ Services
Services should contain the majority of your business logic: - logic that encapsulates your business requirements, calls your data access layer or models, calls API's external to the Node application. And in general, contains most of your algorithmic code. Each service is created per entity. One service should operate only with user or campaign data etc. Try to keep them as lose coupled as possible.
### 🗄️ Models
Mongoose schemes are described in this folder. Since we rely on Mongo db in future and probably wount use any other db, we can afford to work with models directly. Describe any new db entity here.
### 📋 Config
Heer we usually locate some enums, and othe simple static configs that may be reused across the server.
### 🛠 Utils
The last type of logic we'll cover is that of common logic functions that are not necessarily specific to your business logic or domain, or even a REST API in general. A good example of a utility function would be a function that converts milliseconds to minutes and/or seconds, or one that checks two arrays to see if they contain similar items. These are general enough - and reusable enough - that they deserve to go in their own folder.

## 🧰 Project installation
1. Clone project using

```bash

	git clone https://github.com/Charitify/Charitify.git

```
2. Go to the root directory

```bash

	cd Charitify

```

3. Make sure you are running right version of `node.js` and `npm`. View required version inside [.nvmrc](https://github.com/Charitify/Charitify/blob/master/.nvmrc). Install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to manage your node.js versions.
```bash

	nvm use <version of node.js>

```

4. Install dependencies

```bash

	npm install -g sapper && npm install

```

5. Create an `environments` folder and put inside `.env` ord `.env.prod` files in order to run an app. Ask project contributors to share this files.

```bash

	mkdir environments

```
> NOTE ⚠️ : In the current setup local development do not require a local db, app uses a remote one. URI to it is specified in .env files.
6. That's all for now!

## 🏃 Run the project
Since this app is a monolith it includes both frontend and backend. Therefore running an app means compiling both frontend, service-workers and backend. Please read more about **sapper** before starting developing [here](https://sapper.svelte.dev/docs#What_is_Sapper).

### Run app in a dev mode
```bash

    npm run dev

```
This command will use `./environments/.env` config and run `sapper`. Briefly, it would build all necessary files into `__sapper__/dev` folder, and run it from there.

> 💡 Every time you save a file sapper would rebuild dev project and refresh the page.


### Run an app with production config
```bash

    npm run prod

```
This command will use `./environments/.env.prod`



### Build app ready for production
```bash

    npm run build

```
This command would add folder `__sapper__/build`. Inside is a production-ready server, client and service-worker code.

### Run production build
```bash

    npm start

```
> ❗ This build do not any of the `.env` files! It has all variables inserted inside the code.
----

## 📤 Deployment
Charitify app is deployed via [travis-ci]("https://travis-ci.com/github/Charitify"). Deploy is triggered every time you push code to **master** branch. This can be configured in `.travis.yml`. Primary deploy steps happen on VPS that is hosting the project. Travis just ssh to machine and run the `deploy.sh` script on it.

### Simplified deploy steps

1. New commit was pushed to master.
2. Travis CI is triggered to start [build pipeline](https://travis-ci.com/github/Charitify/Charitify/builds).
3. Travis extracts [secured key](https://github.com/dwyl/learn-travis/blob/master/encrypted-ssh-keys-deployment.md) that was added to it`s servers.
4. Travis ssh to remote VPS using the extracted key.
5. Travis executes `deploy.sh` on VPS server.
6. Build is finished successfully if `deploy.sh` is executed with exit code 1

## 👨‍💻 Monitoring
App is running on VPS using [pm2](https://pm2.keymetrics.io/). It is connected to [pm2 plus](https://pm2.io/docs/plus/quick-start/) therefore we can monitor the state of app [here](https://app.pm2.io/). PM2 starting options can be updated inside `deploy.sh` script. Read more about app starting modes [here](https://pm2.keymetrics.io/docs/usage/cluster-mode/)

## 🛡 Security
**Never** share and never comit any of these files:
- SSH keys to the VPS
- `.env` files
- `__sapper__/build` folder (it contains precompiled env variables)
