import { logGets } from '@my/be/sql/log/gets'
import { LogsWrapper } from '@src/list/components/data/LogsWrapper'

export const revalidate = 0

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ searchParams }: PageProps) {
  const where: Record<string, any> = {}
  const {
    name,
    category,
    tag,
    app_name,
    server_name,
    dev,
    time_start,
    time_end,
  } = searchParams

  if (name) where.name = name
  if (category) where.category = category
  if (tag) where.tag = tag
  if (app_name) where.app_name = app_name
  if (server_name) where.server_name = server_name
  if (dev !== undefined) where.dev = dev === 'true'

  if (time_start) {
    where.time_start = Number(time_start)
  }

  if (time_end) {
    where.time_end = Number(time_end)
  }

  try {
    const { error, result } = await logGets({ where })
    if (error) {
      throw error
    }
    let logs = result?.rows || []
    logs = logs.filter((log) => log.tag !== 'place')
    return <LogsWrapper logs={logs} where={where} />
  } catch (error) {
    console.error(error)
    throw error
  }
}
