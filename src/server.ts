import appIsReady from './app';
const PORT = Number(process.env.PORT) || 3000;
appIsReady.then((app) => {
    app.listen(PORT);
    console.log('App now listening for requests.');
}).catch((err) => {
    console.log('App failed to start.', err);
});
