/* global moment */
import Ember from 'ember';
import computed from 'ember-computed-decorators';

const NOVEMBER_2016_RETIREMENT = '2016-11-28T12:00:00-08:00';
const JANUARY_2017_RETIREMENT = '2017-01-20T12:00:00-08:00';

export default Ember.Component.extend({
  queue: Ember.computed.alias('job.queue'),
  jobConfig: Ember.computed.alias('job.config'),

  conjugatedRun: Ember.computed('job.isFinished', function () {
    if (this.get('job.isFinished')) {
      return 'ran';
    } else {
      return 'is running';
    }
  }),

  isLegacyInfrastructure: Ember.computed.equal('queue', 'builds.linux'),

  isTrustySudoFalse: Ember.computed.equal('queue', 'builds.ec2'),
  isMacStadium6: Ember.computed.equal('queue', 'builds.macstadium6'),

  macOSImage: Ember.computed.alias('jobConfig.osx_image'),

  isDeprecatedMacImageXcode6: Ember.computed('queue', 'macOSImage', function () {
    const retiredImages = ['beta-xcode6.1'];
    return this.get('isMacStadium6') && retiredImages.includes(this.get('macOSImage'));
  }),

  isRetiredMacImageXcode6: Ember.computed('queue', 'macOSImage', function () {
    const retiredImages = ['beta-xcode6.2', 'beta-xcode6.3'];
    return this.get('isMacStadium6') && retiredImages.includes(this.get('macOSImage'));
  }),

  isRetiredMacImageXcode7: Ember.computed('queue', 'macOSImage', function () {
    const retiredImages = ['xcode7', 'xcode7.1', 'xcode7.2'];
    return this.get('isMacStadium6') && retiredImages.includes(this.get('macOSImage'));
  }),

  deprecatedXcodeImages:
    ['beta-xcode6.1', 'beta-xcode6.2', 'beta-xcode6.3', 'xcode7', 'xcode7.1', 'xcode7.2'],

  imageToRetirementDate: {
    'beta-xcode6.1': JANUARY_2017_RETIREMENT,
    'beta-xcode6.2': NOVEMBER_2016_RETIREMENT,
    'beta-xcode6.3': NOVEMBER_2016_RETIREMENT,
    'xcode7': NOVEMBER_2016_RETIREMENT,
    'xcode7.1': NOVEMBER_2016_RETIREMENT,
    'xcode7.2': NOVEMBER_2016_RETIREMENT
  },

  imageToNewImage: {
    'beta-xcode6.1': 'xcode6.4',
    'beta-xcode6.2': 'xcode6.4',
    'beta-xcode6.3': 'xcode6.4',
    'xcode7': 'xcode7.3',
    'xcode7.1': 'xcode7.3',
    'xcode7.2': 'xcode7.3'
  },

  newImageStrings: {
    'xcode7.3': 'Xcode 7.3.1',
    'xcode6.4': 'Xcode 6.4'
  },

  @computed('isMacStadium6', 'macOSImage')
  isDeprecatedOrRetiredMacImage(isMacStadium6, macOSImage) {
    return isMacStadium6 && this.get('deprecatedXcodeImages').includes(macOSImage);
  },

  @computed('job.startedAt', 'macOSImage', 'conjugatedRun', 'isDeprecatedOrRetiredMacImage')
  deprecatedOrRetiredMacImageMessage(startedAt, image, conjugatedRun) {
    const retirementDate = Date.parse(this.get('imageToRetirementDate')[image]);

    const newImage = this.get('imageToNewImage')[image];
    const newImageString = this.get('newImageStrings')[newImage];
    const newImageAnchor = newImageString.replace(' ', '-');
    const newImageLink = `https://docs.travis-ci.com/user/osx-ci-environment/#${newImageAnchor}`;

    const jobRanBeforeRetirementDate = Date.parse(startedAt) < retirementDate;
    const retirementDateIsInTheFuture = retirementDate > new Date();

    const retirementSentence = `
      This job ${conjugatedRun} on an OS X image that
      <a href='${newImageLink}'>${retirementDateIsInTheFuture ? 'will be retired' : 'was retired'}
      on ${moment(retirementDate).format('MMMM D, YYYY')}</a>.`;

    let routingSentence;

    if (retirementDateIsInTheFuture) {
      routingSentence =
        `After that, this will route to our ${newImageString} infrastructure.`;
    } else if (jobRanBeforeRetirementDate) {
      routingSentence = `New jobs will route to our ${newImageString} infrastructure.`;
    } else {
      routingSentence = `This was routed to our ${newImageString} infrastructure.`;
    }

    return `${retirementSentence} ${routingSentence}`;
  }
});
