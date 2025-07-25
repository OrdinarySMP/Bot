import { apiFetch } from '../../../utils/apiFetch.js';
import dayjs from 'dayjs';

export const getApplicationById = async (applicationId) => {
  const response = await apiFetch('/application', {
    method: 'GET',
    query: {
      'filter[id]': applicationId,
      include: 'restrictedRoles',
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to retrieve application questions: ${await response.text()}`
    );
  }
  return (await response.json()).data[0];
};

export const createApplicationSubmission = async (applicationId, discordId) => {
  const response = await apiFetch('/application-submission', {
    method: 'POST',
    body: {
      application_id: applicationId,
      discord_id: discordId,
      state: 0,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create application submission: ${await response.text()}`
    );
  }

  return (await response.json()).data;
};

export const getApplicationQuestions = async (applicationId) => {
  const response = await apiFetch('/application-question', {
    method: 'GET',
    query: {
      'filter[application_id]': applicationId,
      'filter[is_active]': true,
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to retrieve application questions: ${await response.text()}`
    );
  }
  return (await response.json()).data;
};

export const submitAnswer = async (
  applicationSubmissionid,
  questionId,
  answer,
  attachments
) => {
  const response = await apiFetch('/application-question-answer', {
    method: 'POST',
    body: {
      application_submission_id: applicationSubmissionid,
      application_question_id: questionId,
      answer,
      attachments,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    if (error.message === 'Application was cancelled.') {
      throw new Error(error.message);
    }
    throw new Error(`Failed to submit answer: ${await response.text()}`);
  }
};

export const submitApplicationSubmission = async (applicationSubmissionid) => {
  const response = await apiFetch(
    `/application-submission/${applicationSubmissionid}`,
    {
      method: 'PUT',
      body: {
        state: 1,
        submitted_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to submit application: ${await response.text()}`);
  }
};

export const acceptApplicationSubmission = async (
  applicationSubmissionid,
  userId,
  templateId = null,
  reason = null
) => {
  const response = await apiFetch(
    `/application-submission/${applicationSubmissionid}`,
    {
      method: 'PUT',
      body: {
        state: 2,
        handled_by: userId,
        application_response_id: templateId,
        custom_response: reason,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to accept application: ${await response.text()}`);
  }
};

export const denyApplicationSubmission = async (
  applicationSubmissionid,
  userId,
  templateId = null,
  reason = null
) => {
  const response = await apiFetch(
    `/application-submission/${applicationSubmissionid}`,
    {
      method: 'PUT',
      body: {
        state: 3,
        handled_by: userId,
        application_response_id: templateId,
        custom_response: reason,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to deny application: ${await response.text()}`);
  }
};

export const getApplicationSubmissionHistory = async (
  applicationSubmissionid
) => {
  const response = await apiFetch(
    `/application-submission/${applicationSubmissionid}/history`,
    {
      method: 'GET',
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to retrieve users applications: ${await response.text()}`
    );
  }
  return (await response.json()).data;
};
