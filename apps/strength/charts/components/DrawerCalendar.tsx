type Props = {
  drawerOpened: boolean
  closeDrawer: () => void
}

export function DrawerCalendar({ drawerOpened, closeDrawer }: Props) {
  const width = 360
  const height = window.screen.availHeight + 2
  const backColor = '1e222d'
  const fontColor = 'cccccc'
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: drawerOpened ? width : 0,
        overflow: 'hidden',
        transition: 'width 0.3s ease-in-out',
        zIndex: 1500,
        backgroundColor: '#1e222d',
      }}
    >
      <button
        onClick={closeDrawer}
        style={{
          position: 'absolute',
          padding: '10px',
          color: `#${fontColor}`,
          background: `#${backColor}`,
          scale: '1.36 1',
        }}
      >
        X
      </button>
      <iframe
        style={{
          marginTop: '10px',
        }}
        width={width}
        height={height}
        src={`https://feed.financialjuice.com/widgets/ecocal.aspx?wtype=ECOCAL&mode=standard&container=financialjuice-eco-widget-container&width=${width}px&height=${height}px&backC=${backColor}&fontC=${fontColor}&affurl=`}
      ></iframe>
    </div>
  )
}
