cd /home/Charitify
rm -rf ./__sapper__
git pull
npm run i
npm run export
npm run build
if pm2 start  __sapper__/build/index.js --name charitify ; then
    echo "Finish"
else
    pm2 restart charitify --update-env
    echo "Finish"
fi