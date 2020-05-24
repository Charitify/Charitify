import sirv from 'sirv';
import express from 'express';
import compression from 'compression';
import * as sapper from '@sapper/server';
import session from 'express-session';
import { setup, endpoints } from '@config'
import * as controllers from '@controllers'

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

function getUrl(path) {
	return `${setup.BACKEND_URL}${path}`
}

express() // You can also use Polka
	.get(getUrl(endpoints.FUND()), controllers.FundsController.getFund)
	.get(getUrl(endpoints.FUNDS()), controllers.FundsController.getFunds)
	.get(getUrl(endpoints.USER()), controllers.UsersController.getUser)
	.get(getUrl(endpoints.USERS()), controllers.UsersController.getUsers)
	.get(getUrl(endpoints.RECENT()), controllers.NewsController.getNews)
	.get(getUrl(endpoints.RECENTS()), controllers.NewsController.getNewss)
	.get(getUrl(endpoints.COMMENT()), controllers.CommentsController.getComment)
	.get(getUrl(endpoints.COMMENTS()), controllers.CommentsController.getComments)
	.get(getUrl(endpoints.ORGANIZATION()), controllers.OrganizationsController.getOrganization)
	.get(getUrl(endpoints.ORGANIZATIONS()), controllers.OrganizationsController.getOrganizations)
	.use(
		'/Charitify',
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		sapper.middleware(),
		session({
			secret: 'keyboard cat',
			resave: false,
			saveUninitialized: true,
			cookie: { secure: true }
		})
	)
	.listen(PORT, (err) => {
		if (err) console.log('error', err);
	});
