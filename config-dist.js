
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
    }
};

module.exports = config;