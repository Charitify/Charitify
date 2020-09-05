cd /home/Charitify
rm -rf ./__sapper__
git checkout maser
git pull

echo "Installing packages"
npm install

echo "Exporting static files"
npm run export

echo "Building production code"
npm run build

echo "Checking pm2 version: "
if !pm2 -v; then npm install pm2 -g
    fi

if pm2 start  __sapper__/build/index.js --name charitify ; then
    echo "Finish"
else
    pm2 restart charitify --update-env
    echo "Finish"
fi

exit 0