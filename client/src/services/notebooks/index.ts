import NotebookServiceMock from './NotebookService.mock'
import NotebookServiceApi from './NotebookService.api'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const notebookService = useMock ? NotebookServiceMock : NotebookServiceApi

export default notebookService
