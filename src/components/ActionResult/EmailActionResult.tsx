import { ActionResult, type ActionResultProps } from './ActionResult'

export type EmailActionResultProps = ActionResultProps

export function EmailActionResult(props: EmailActionResultProps) {
  return <ActionResult {...props} />
}
