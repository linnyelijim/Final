const whitelist = [        //allowed domains
    'https://final-inf653.glitch.me',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'https://dazzling-snickerdoodle-777101.netlify.app',
    'https://www.thunderclient.com'
];
const corsOptions = {       //regulates CORS using whitelist
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
}

module.exports = corsOptions;