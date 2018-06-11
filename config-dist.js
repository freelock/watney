
var config = {
    myUserId: "@bot:matrix.freelock.com",
    myAccessToken: "",
    admins: ['don','chris','rafael','john'],
    adminHomeServer: 'matrix.freelock.com',
    stateName: 'com.freelock.project',
    releaseName: 'com.freelock.release',
    defaultReleaseManager: 'john',
    defaultProjectManager: 'don',
    reminderName: 'com.freelock.reminder',
    concourseDir: '/path/to/pipelines',
    concoursePipelineCmd: './set_pipeline.sh',
    concourseUser: 'username',
    concoursePass: 'password',
    concourseCredentials: '~/credentials.yaml',
    auriga: {
        auth: 'username:pass',
        hostname: 'host.freelock.com',
        protocol: 'https:',
        path: '/auriga/store/',
        port: 443
    },
    homeroom: '!hXysgSAERKRcnuFn:matrix.freelock.com',
    deployroom: '!hXysgSAERKRcnuFn:matrix.freelock.com',
    sources: {
        taiga: 'https://taiga.freelock.com/project/{alias}/{itemtype}/{id}',
        auriga: 'https://intranet.freelock.com/auriga2/task/{id}',
        carina: 'https://projects.freelock.com/{alias}/node/{id}',
        atrium: 'https://intranet.freelock.com/atrium/{alias}/node/{id}'
    },
    notelifyMergeFile: '',
    notelifyFrom: 'sender@example.com',
    notelifyCC: 'email@example.com',
    mjmlPath: '/path/to/template/dir',
    releasePolicies: {
        'R': 'Notify on release',
        '2H': '2 hour notification',
        '1D': '1 day notification',
        '2D': '2 day notification',
        'NO': 'Notify and hold',

        'WDA': 'Weekday AM',
        'WDP': 'Weekday PM',
        'WDE': 'Weekday Eve',
        'WEE': 'Weekend Eve',
        'A': 'Anytime'
    },
    nodeMailerConfig: {
        host: 'mailjet',
        port: 25,
        secure: false
        // auth: {
        //    user: 'user',
        //    pass: 'pass'
        // }
    },
    modules: [
        './lib/drupalLogin',
        './lib/release',
        './lib/drupalState',
        './lib/siteStatus',
        './lib/concoursePipelines',
        './lib/auriga',
        './lib/taiga',
        './lib/remind',
        './lib/notelify'
    ]
};

module.exports = config;