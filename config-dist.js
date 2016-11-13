
var config = {
    myUserId: "@bot:matrix.freelock.com",
    myAccessToken: "",
    admins: ['don','chris','rafael','john'],
    adminHomeServer: 'matrix.freelock.com',
    stateName: 'com.freelock.project',
    releaseName: 'com.freelock.release',
    defaultReleaseManager: 'john',
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
    deployroom: '!hXysgSAERKRcnuFn:matrix.freelock.com'
};

module.exports = config;