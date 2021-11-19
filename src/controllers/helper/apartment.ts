import taskRequestModel from '../../models/taskRequest'
import taskAssignmentModel from '../../models/taskAssignment'
import taskModel from '../../models/task'

import pusher, { makeChannel, pusherConstant } from '../../pusherConfig'

async function notifyAfterLeaving(
  memberIds: number[],
  leaverUsername: string,
  currentAdminUsername: string
): Promise<void> {
  try {
    await pusher.trigger(
      memberIds.map((memberId) => makeChannel(memberId)),
      pusherConstant.APARTMENT_EVENT,
      {
        state: pusherConstant.LEAVE_STATE,
        leaver: leaverUsername,
        admin: currentAdminUsername,
      }
    )
  } catch (err) {
    console.log(err)
  }
}

async function cleanTaskRequests(memberIds: number[], leaverId: number): Promise<void> {
  const responseTaskRequests = await taskRequestModel.findResponseTaskRequests(memberIds)

  for (const { task, requests } of responseTaskRequests) {
    if (requests.length === 1 && requests[0].assignee.id === leaverId) {
      await taskModel.deleteOne({ id: task.id })
      continue
    }

    const leaverRequest = requests.find((_request) => _request.assignee.id === leaverId)

    if (!leaverRequest) continue
    await taskRequestModel.updateMany({ task_id: task.id }, { state: 'pending' })
  }
  await taskRequestModel.deleteMany({ assignee_id: leaverId })
}

async function cleanTaskAssignments(memberIds: number[], leaverId: number): Promise<void> {
  const responseAssignments = await taskAssignmentModel.findResponseTaskAssignments(memberIds)

  for (const { task, assignments } of responseAssignments) {
    if (assignments.length === 1 && assignments[0].assignee.id === leaverId) {
      await taskModel.deleteOne({ id: task.id })
      continue
    }

    const leaverAssignment = assignments.find((assignment) => assignment.assignee.id === leaverId)

    if (!leaverAssignment) continue

    for (const assignment of assignments) {
      if (assignment.order > leaverAssignment.order) {
        await taskAssignmentModel.update({ id: assignment.id }, { order: assignment.order - 1 })
      }
    }
  }
  await taskAssignmentModel.deleteMany({ assignee_id: leaverId })
}

export const leaveApartmentHelper = {
  notifyAfterLeaving,
  cleanTaskRequests,
  cleanTaskAssignments,
}
