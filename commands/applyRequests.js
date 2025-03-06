import { apiFetch } from '../utils/apiFetch.js';
import dayjs from 'dayjs';

export const createApplication = async (discordId) => {
  const response = await apiFetch('/application', {
    method: 'POST',
    body: { discord_id: discordId, state: 0 },
  });

  if (!response.ok)
    throw new Error(
      'Failed to create application: ' + JSON.stringify(await response.json())
    );
  const responseJson = await response.json();
  return {
    appId: responseJson.id,
    createdAt: responseJson.created_at,
  };

};

export const getApplicationQuestions = async () => {
  const response = await apiFetch('/application-question', {
    method: 'GET',
    query: { 'filter[is_active]': true },
  });
  if (!response.ok) throw new Error('Failed to retrieve application questions: ' + JSON.stringify(await response.json()));
  return (await response.json()).data;
};

export const submitAnswer = async (appId, questionId, answer) => {
  const response = await apiFetch('/application-question-answer', {
    method: 'POST',
    body: {
      application_id: appId,
      application_question_id: questionId,
      answer,
    },
  });
  if (!response.ok) throw new Error('Failed to submit answer: ' + JSON.stringify(await response.json()));
};

export const submitApplication = async (appId, messageLink) => {
  const response = await apiFetch(`/application/${appId}`, {
    method: 'PUT',
    body: { state: 1, submitted_at: dayjs().format('YYYY-MM-DD HH:mm:ss'), message_link: messageLink },
  });
  if (!response.ok) throw new Error('Failed to submit application: ' + JSON.stringify(await response.json()));
};

export const getAllApplications = async (discordId) => {
  const response = await apiFetch('/application', {
    method: 'GET',
    query: { 'filter[discord_id]': discordId, },
  });
  if (!response.ok) throw new Error('Failed to retrieve users applications: ' + JSON.stringify(await response.json()));
  return (await response.json()).data;
}
