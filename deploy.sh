
cd /home/Charitify

rm -rf ./__sapper__

git checkout master

if ! git pull ; then
    exit 1
fi

echo "Installing packages"
npm install

echo "Building production code"
npm run build

echo "Checking pm2 version: "
if ! pm2 -v ; then
    npm install pm2 -g
fi

echo "Checking sapper version: "
if ! sapper -v ; then
    npm install sapper -g
fi

if ! pm2 start  __sapper__/build/index.js --name charitify ; then
    pm2 restart charitify --update-env
    echo "Finish"
fi

# If nginx config was changed use this command to restart hte server
# systemctl restart nginx

exit 0