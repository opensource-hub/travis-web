/* global Travis */
import TravisRoute from 'travis/routes/basic';
import config from 'travis/config/environment';
import BuildFaviconMixin from 'travis/mixins/build-favicon';
import Ember from 'ember';

import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/route';

let { service } = Ember.inject;

export default TravisRoute.extend(BuildFaviconMixin, KeyboardShortcuts, {
  flashes: service(),
  auth: service(),

  needsAuth: false,

  renderTemplate: function () {
    if (this.get('config').pro) {
      Ember.$('body').addClass('pro');
    }
    return this._super(...arguments);
  },

  model() {
    if (this.get('auth.signedIn')) {
      return this.get('fetchFeatures.fetchTask').perform();
    }
  },

  activate() {
    var repos;
    if (!this.get('features.proVersion')) {
      repos = this.get('store').peekAll('repo');
      repos.forEach((repo) => {
        return this.subscribeToRepo(repo);
      });
      return repos.addArrayObserver(this, {
        willChange: 'reposWillChange',
        didChange: 'reposDidChange'
      });
    }
  },

  reposWillChange() {},

  reposDidChange(array, start, removedCount, addedCount) {
    var addedRepos;
    addedRepos = array.slice(start, start + addedCount);
    return addedRepos.forEach((repo) => {
      return this.subscribeToRepo(repo);
    });
  },

  subscribeToRepo: function (repo) {
    if (this.pusher) {
      return this.pusher.subscribe('repo-' + (repo.get('id')));
    }
  },

  title(titleParts) {
    if (titleParts.length) {
      titleParts = titleParts.reverse();
      titleParts.push('Travis CI');
      return titleParts.join(' - ');
    } else {
      return config.defaultTitle;
    }
  },

  keyboardShortcuts: {
    'up': {
      action: 'disableTailing',
      preventDefault: false
    },
    'down': {
      action: 'disableTailing',
      preventDefault: false
    }
  },

  actions: {
    disableTailing() {
      Travis.tailing.stop();
    },

    redirectToGettingStarted() {
      this.transitionTo('getting_started');
    },

    error(error) {
      if (error === 'needs-auth') {
        this.set('auth.redirected', true);
        return this.transitionTo('auth');
      } else {
        return true;
      }
    },

    renderFirstSync() {
      return this.transitionTo('first_sync');
    },

    afterSignIn() {
      this.get('flashes').clear();
      let transition = this.auth.get('afterSignInTransition');
      if (transition) {
        this.auth.set('afterSignInTransition', null);
        return transition.retry();
      } else {
        return this.transitionTo('main');
      }
    },

    afterSignOut() {
      this.controllerFor('repos').reset();
      this.controllerFor('repo').reset();
      this.setDefault();
      if (this.get('config.enterprise')) {
        return this.transitionTo('auth');
      } else {
        return this.transitionTo('main.index');
      }
    }
  }
});
