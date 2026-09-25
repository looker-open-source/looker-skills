import './App.css'
import VizComponent from './VizComponent.tsx'
import { LookerChartData, LookerChartConfig } from './utils/types'

interface AppProps {
  data: LookerChartData;
  config: LookerChartConfig;
}

function App({ data, config }: AppProps) {
  if (!data || data.length === 0) {
    return <div>Loading or No Data...</div>;
  }

  return (
    <div className="app-container">
      <VizComponent data={data} config={config} />
    </div>
  )
}

export default App
