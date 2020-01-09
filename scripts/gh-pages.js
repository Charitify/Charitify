var ghpages = require('gh-pages');

ghpages.publish(
  '__sapper__/export/Charitify',
  {
    branch: 'gh-pages',
    repo: 'https://github.com/Bublikus/Charitify.git',
    user: {
      name: 'bublik',
      email: 'bublik.script@gmail.com'
    }
  },
  () => {
    console.log('Deploy Complete!')
  }
)
