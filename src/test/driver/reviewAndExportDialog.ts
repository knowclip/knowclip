import { ClientWrapper } from './ClientWrapper'

export const checkboxesChecked = async (
  client: ClientWrapper,
  checkboxTestLabel: string
) => {
  const elements = await Promise.all(
    await client.elements_(`${checkboxTestLabel} input`)
  )
  return await Promise.all(elements.map((mediaFile) => mediaFile.isSelected()))
}
