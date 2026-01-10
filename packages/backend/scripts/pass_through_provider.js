export default class PassThroughProvider {
  constructor(options) {
    this.providerId = options.id || 'pass-through';
    this.config = options.config;
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt, context) {
    return {
      output: context.vars.content || '',
    };
  }
}
