import constants from '../../../constants.js';
import utils from '../../../utils.js';

const { DwController } = WebCardinal.controllers;

class NewVotingSessionUI {
  getInitialViewModel() {
    return {
      submitVotingType: 'opinion',
      votingType: 'Consultation / Opinion Poll',
      hasDefaultAnswers: false,
      isFixedStructure: false,
      defaultAnswers: [{
        label: 'Yes'
      }, {
        label: 'No'
      }, {
        label: 'Abstain'
      }],
      form: {
        uid: utils.uuidv4(),
        hasVoted: false,
        question: '',
        possibleAnswers: [],
        deadline: '',
        isUniqueAnswer: false,
        votingActions: {
          placeholder: 'Voting action',
          options: [{
            label: 'Enroll Partner',
            value: 'enroll-partner'
          }]
        },
        selectedVotingAction: '',
        partnerDID: '',
        candidateDocumentation: null,
        candidateDocumentationName: ''
      }
    };
  }
}

class NewVotingSessionController extends DwController {
  constructor(...props) {
    super(...props);

    this.ui.page = new NewVotingSessionUI();
    this.model = this.ui.page.getInitialViewModel();
    this.init();
  }

  init() {
    this.attachViewEventListeners();
    this.attachInputEventListeners();
  }

  attachViewEventListeners() {
    this.onTagClick('vote.type.opinion', () => {
      this.model.submitVotingType = 'opinion';
      this.model.votingType = 'Consultation / Opinion Poll';
      this.model.hasDefaultAnswers = false;
    });

    this.onTagClick('vote.type.generic', () => {
      this.model.submitVotingType = 'generic';
      this.model.votingType = 'Generic Proposal';
      this.model.hasDefaultAnswers = true;
    });

    this.onTagClick('vote.type.fixed', () => {
      this.model.submitVotingType = 'fixed';
      this.model.votingType = 'Fixed Structure Proposal';
      this.model.isFixedStructure = true;
      this.model.hasDefaultAnswers = true;
      setTimeout(() => {
        this.attachVotingActionsListener();
        this.attachDIDInputListener();
      }, 10);
    });

    this.onTagClick('vote.answer.add', (model, target, event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const inputsPossibleAnswers = document.querySelectorAll('#possible-responses sl-input');
      for (let index = 0; index < inputsPossibleAnswers.length; ++index) {
        this.model.form.possibleAnswers[index] = { label: inputsPossibleAnswers[index].value };
      }

      this.model.form.possibleAnswers.push({ label: '' });
    });

    this.onTagClick('input.paste', async (model, target) => {
      try {
        const result = await navigator.permissions.query({
          name: 'clipboard-read'
        });
        if (result.state === 'granted' || result.state === 'prompt') {
          const clipboardValue = await navigator.clipboard.readText();
          target.parentElement.value = clipboardValue;
          return { clipboardValue };
        }
        throw Error('Coping from clipboard is not possible!');
      } catch (err) {
        target.remove();
        console.log(err);
        return '';
      }
    });

    this.onTagClick('vote.new.submit', async (model, target, event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const modelSubmit = this.model.toObject('form');
      modelSubmit.votingType = this.model.votingType;
      modelSubmit.submitVotingType = this.model.submitVotingType;
      const possibleAnswers = this.model.hasDefaultAnswers ? this.model.defaultAnswers.map(answer => answer.label) : [];
      const possibleAnswersInputs = document.querySelectorAll('#possible-responses sl-input');
      for (let index = 0; index < possibleAnswersInputs.length; ++index) {
        possibleAnswers.push(possibleAnswersInputs[index].value);
      }
      modelSubmit.possibleAnswers = possibleAnswers;

      const documentation = document.querySelector('#upload-documentation');
      if (documentation && documentation.files.length) {
        modelSubmit.candidateDocumentation = documentation.files[0];
        modelSubmit.candidateDocumentationName = modelSubmit.candidateDocumentation.name;
      }

      await this.submitVotingSession(modelSubmit);
    });
  }

  attachInputEventListeners() {
    this.attachTextareaListener();
    this.attachDeadlineListener();
    this.attachUniqueResponseListener();
  }

  attachTextareaListener() {
    const questionVoteName = document.querySelector('#question-vote-name');
    const questionVoteNameHandler = (event) => {
      this.model.form.question = event.target.value;
    };
    questionVoteName.addEventListener('sl-change', questionVoteNameHandler);
    questionVoteName.addEventListener('sl-input', questionVoteNameHandler);
  }

  attachDeadlineListener() {
    const deadline = document.querySelector('#deadline');
    const deadlineHandler = (event) => {
      this.model.form.deadline = event.target.value;
    };
    deadline.addEventListener('sl-change', deadlineHandler);
    deadline.addEventListener('sl-input', deadlineHandler);
  }

  attachUniqueResponseListener() {
    const responseType = document.querySelector('#response-type');
    const responseTypeHandler = () => {
      this.model.form.isUniqueAnswer = responseType.checked;
    };
    responseType.addEventListener('sl-change', responseTypeHandler);
  }

  attachVotingActionsListener() {
    const votingActions = document.querySelector('#voting-action');
    const votingActionsHandler = (event) => {
      const selectedValue = event.detail.item.value;
      this.model.form.selectedVotingAction = selectedValue;
      this.model.form.votingActions.placeholder = this.model.votingActions.options
        .find(op => op.value === selectedValue).label;
    };
    votingActions.addEventListener('sl-select', votingActionsHandler);
  }

  attachDIDInputListener() {
    const partnerDID = document.querySelector('#partner-did');
    const partnerDIDHandler = (event) => {
      this.model.form.partnerDID = event.target.value;
    };
    partnerDID.addEventListener('sl-change', partnerDIDHandler);
    partnerDID.addEventListener('sl-input', partnerDIDHandler);
  }

  async submitVotingSession(model) {
    await this.sharedStorageService.insertRecordAsync(constants.TABLES.GOVERNANCE_VOTING_SESSIONS, utils.getPKFromCredential(model.deadline), model);
    this.model.votingSessions.push(model);
    this.model.isNewVotingOpened = false;
    this.model.form = this.ui.page.getInitialViewModel().form;
  }
}

export default NewVotingSessionController;
export { NewVotingSessionUI };