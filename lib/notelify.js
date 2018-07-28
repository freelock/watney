/**
 * Email notifications for releases
 */

"use strict";

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const Mustache = require('mustache');
const mjml2html = require('mjml');
const nodemailer = require('nodemailer');
const htmlToText = require('nodemailer-html-to-text').htmlToText;
const Sugar = require('sugar');

const watneyDir = process.cwd();

Papa.parsePromise = function(file, options) {
  return new Promise(function(complete, error){
      Papa.parse(file, {
          ... options,
          complete,
          error
      });
  })
}

class NotFoundError extends Error {
  constructor(...args) {
    super(...args);
    this.name = 'NotFoundError';
  }
};

module.exports = {
    container: null,
    transport: null,
    setup: function(container) {
        container.bangCommands['notelify'] = {
            'help': 'send a notification to a client',
            cb: this.notelify.bind(this)
        };

        container.PubSub.subscribe('notelify',
            this.notelifyEvent.bind(this)
        );
        this.container = container;
        this.defaultData.mergeFile = container.config.notelifyMergeFile;
        this.transport = nodemailer.createTransport(container.config.nodeMailerConfig);
        this.transport.use('compile', htmlToText());
    },

    notelify(room, body, event) {
      const container = this.container,
        alias = container.getState(room, 'alias'),
        args = container.parseArgs(body);
      let data = {
        alias: alias
      }
      switch (args[1]) {
        case 'scheduled':
          this.loadReleaseData(room, data);

          this._notelify({
            template: 'protection-stage.mjml',
            subject: 'Pending release for {{ Website }}',
            ...data
          });
          break;
        case 'released':
        case 'release':
          this.loadReleaseData(room, data);
          this._notelify({
            template: 'protection-released.mjml',
            subject: '{{ Website }} - Release deployed to production.',
            ...data
          });
          break;

        case 'list':

        default:
          this._notelify({
            alias: alias,
            template: args[1],
            subject: body.substring(args[0].length + args[1].length + 2)
          });
      }
      this._notelify(data);

    },

    defaultData: {
        mergeData: {},
        mergeFile: ''
    },
    /**
     * Accepts a PubSub event.
     * 
     * @param {string} topic -- PubSub event "notelify"
     * @param {object} data -- template🔗, alias🔗, mergeData, mergeFile
     */
    notelifyEvent(topic, data) {
      const room = this.container.roomsByAlias[data.alias];
      if (data.state == 'released' || data.state == 'scheduled') {
        this.loadReleaseData(room, data);
      }
      this._notelify(data);
    },

    async _notelify(data) {
      let mergeData = {
        ...data.mergeData
      }
      const container = this.container, 
        items = {
          ...this.defaultData,
          ...data
        };
      
      try {
        if (items.mergeFile) {
          const dataStream = fs.createReadStream(items.mergeFile);
          const csvData = await Papa.parsePromise(dataStream, {
            header: true
          });
          let [fileData] = csvData.data.filter(row => row.alias == data.alias);
          //fs.close(dataStream);
          if (!fileData) {
            throw new NotFoundError(`${data.alias} not found in mergeFile.`);
          }
          mergeData = {
            notice_date: new Date(),
            ...fileData,
            ...items
          }
        }
        // now mergeData should be ready to plug in...
        const mjmlPath = container.config.mjmlPath;
        // This seems to happen every time, with additional read... but we're already done.
        if (!items.template){
          return;
        }
        process.chdir(mjmlPath);
        const mjmlFile = fs.readFileSync(mjmlPath + '/' + items.template, 'utf8');
        const attachments = [
            {filename: 'ask-us.png', path: mjmlPath + '/ask-us.png', cid: 'ask-us.png'},
            {filename: 'call-us.png', path: mjmlPath + '/call-us.png', cid: 'call-us.png'},
            {filename: 'meet-us.png', path: mjmlPath + '/meet-us.png', cid: 'meet-us.png'}
        ];
        const mjmlTemplate = mjml2html(mjmlFile);
        const body = Mustache.render(mjmlTemplate.html, mergeData);
        const subject = Mustache.render(mergeData.subject, mergeData);
        process.chdir(watneyDir);
        const to = mergeData.email;
        const from = container.config.notelifyFrom;
        const cc = container.config.notelifyCC;
        if (!to) {
          throw new NotFoundError('No "to" value set.');
        }        
        this.transport.sendMail({
          from: from,
          to: to,
          cc: cc,
          subject: subject,
          html: body,
          attachments: attachments
        })

        container.send(container.roomsByAlias[data.alias], `Sent ${items.template} to ${to}.`);
      } catch (e) {
        if (!data.alias || !container.roomsByAlias[data.alias]) {
          console.log(e);
          container.send(container.config.homeroom, 'Notelify sent with no alias, or alias not found.. See console.', 'error');
          return;
        }
        const room = container.roomsByAlias[data.alias];

        if (e.name == 'NotFoundError') {
          container.send(room, e.message, 'error');
          return;
        }
        throw e;
      }

    },

    loadReleaseData(room, data) {
      const container = this.container;
      data.release = container.getState(room, '', container.config.releaseName);
      data.release.noteHtml = data.release.notes.length ? data.release.notes.join('</li><li>') : 'No notes';
      data.release.stepHtml = data.release.steps.length ? data.release.steps.join('</li><li>') : 'No steps';
      data.release.testHtml = data.release.tests.length ? data.release.tests.join('</li><li>') : 'No tests';
      data.release.commitHtml = data.release.commits.length ? data.release.commits.join('</li><li>') : 'No commits';
      if (!data.release.targetDate) {
        data.release.date = 'Immediately';
      } else {
        data.release.date = new Date(data.release.targetDate).toLocaleString('en-US', {timeZone: 'America/Los_Angeles'}) + " Pacific Time";
      }
      data.release.caseHtml = Object.keys(data.release.cases).length ? Object.keys(data.release.cases).map((item) => {
        let val = data.release.cases[item];
        if (typeof val === 'string') {
          return val;
        }
        if (!val.url) {
          val.itemtype = 'us';
          val.url = Sugar.String.format(container.config.sources[val.source], val);
        }
        return `<a href="${val.url}">${val.source} #${val.id}</a> - ${val.title}`;
      }).join('</li><li>'): 'No cases';
      data.release.policyHtml = container.getPolicy(room);
    }

}
