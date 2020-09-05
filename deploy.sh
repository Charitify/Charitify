cd /home/Charitify
rm -rf ./__sapper__
git checkout maser
git pull

npm install
echo "installing packages"

npm run export
echo "exporting static files"

npm run build
echo "building production code"

if pm2 -v; then
    echo "pm2 is insalled"
else
    npm install pm2 -g
fi

if pm2 start  __sapper__/build/index.js --name charitify ; then
    echo "Finish"
else

    if pm2 restart charitify --update-env; then
        echo 'Failed!'
        exit 1

    echo "Finish"
fi

exit 0