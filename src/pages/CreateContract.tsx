import * as React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { IApplicationState, IConnectedReduxProps } from '../store'
import { createContract } from '../store/transport/actions'
import { Formik, FormikProps, Form, Field, FieldProps, FieldArray, ArrayHelpers } from 'formik'
import { IEthContractFormValues } from '../store/wallets/types'
import {
  Column,
  Label,
  TextInput,
  ButtonBase,
  Row,
  Wrap,
  Select,
} from '../components/atoms'
import { getPublicMethodNames, IAbiEntry, getArguments, IAbiArgument } from '../helpers/eth/eth-contracts'

interface IPropsFromState {
}

interface IPropsFromDispatch {
  createCont: typeof createContract
}

interface IStateProps {
  publicMethodNames: string[]
  methodArgs: IAbiArgument[]
}

type AllProps = IPropsFromState & IPropsFromDispatch & IConnectedReduxProps

class CreateContractPage extends React.Component<AllProps, IStateProps> {
  constructor(props: AllProps) {
    super(props)

    this.state = {
      publicMethodNames: [],
      methodArgs: [],
    }
  }

  handleOnChangeAbi = async (
    e: React.ChangeEvent<HTMLInputElement>,
    form: any
  ) => {
    console.log(form)
    if (!e.target.files) {
      return
    }

    let file = e.target.files[0]
    console.log(file)
    const reader = new FileReader()
    reader.readAsText(file)
    const result = (await new Promise(resolve => {
      reader.onload = () => {
        resolve(JSON.parse(reader.result as string))
      }
    })) as IAbiEntry[]

    form.setFieldValue('abi', result)

    const publicMethodNames = getPublicMethodNames(result)
    this.setState({ publicMethodNames })
  }

  render() {
    const { publicMethodNames, methodArgs } = this.state
    const {createCont} = this.props
    return (
      <React.Fragment>
        <Formik
          initialValues={{ to: '', abi: [], method: '', gasPrice: '5', gasLimit: "300000", args: []}}
          onSubmit={(values: IEthContractFormValues) => createCont(values)}
          render={(formikBag: FormikProps<IEthContractFormValues>) => (
            <Form>
              <Column>
                <Row>
                  <Column style={{ flexBasis: '65%', marginRight: '5%' }}>
                    <Label>Address:</Label>
                    <Field
                      name="to"
                      render={({
                        field,
                        form,
                      }: FieldProps<IEthContractFormValues>) => (
                        <TextInput
                          type="text"
                          placeholder="Address"
                          {...field}
                        />
                      )}
                    />
                  </Column>
                  <Column style={{ flexBasis: '30%' }}>
                    <Label>
                      <small>Select from computer:</small>
                    </Label>
                    <div style={{ flexBasis: '30%', position: 'relative' }}>
                      <ButtonBase>Upload ABI</ButtonBase>
                      <Field
                        name="abi"
                        render={({
                          field,
                          form,
                        }: FieldProps<IEthContractFormValues>) => (
                          <TextInput
                            type="file"
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={e => this.handleOnChangeAbi(e, form)}
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              opacity: 0,
                            }}
                          />
                        )}
                      />
                    </div>
                    <Wrap vertical={1} />
                  </Column>
                </Row>
                <Row>
                  <Column>
                    <Label>Method:</Label>
                    <Field
                      name="method"
                      render={({ field, form }: FieldProps<IEthContractFormValues>) => (
                        <Select
                          {...field}
                          onChange={e => {
                            form.setFieldValue('method', e.target.value)
                            const args = getArguments(form.values.abi, e.target.value)
                            form.setFieldValue('args', new Array(args.length).fill(''))
                            this.setState({methodArgs: args})
                          }}
                        >
                          <option value="">Select method</option>
                          {publicMethodNames.map(item => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                    <Wrap vertical={1} />
                    <FieldArray
                      name="args"
                      render={({ form, }: ArrayHelpers & { form: FormikProps<IEthContractFormValues> })  => (
                        form.values.args && form.values.args.length > 0 && 
                          <React.Fragment>
                            <Label>Parameters:</Label>
                            {form.values.args.map((arg, index: number) => (
                              <Field
                                key={index}
                                name={`args[${index}`}
                                render={({ field }: FieldProps<IEthContractFormValues>) => (
                                  <TextInput
                                    type="text"
                                    placeholder={methodArgs[index].name}
                                    {...field}
                                  />
                                )}
                              />
                            ))}
                          </React.Fragment>
                      )}
                    />
                  </Column>
                  <Column>
                    <Wrap horizontal={2}>
                      <Label>Estimated GAS: WAAAAAT</Label>
                      <Wrap vertical={1} />
                      <Label>GAS price: WAAAAAt GWEI</Label>
                      <Field
                        name="gasPrice"
                        render={({
                          field,
                          form,
                        }: FieldProps<IEthContractFormValues>) => (
                          <TextInput
                            type="range"
                            placeholder="Address"
                            {...field}
                            min="1"
                            max="7"
                          />
                        )}
                      />
                    </Wrap>
                  </Column>
                </Row>
                <ButtonBase type="submit">Continue</ButtonBase>
              </Column>
            </Form>
          )}
        />
      </React.Fragment>
    )
  }
}

const mapStateToProps = ({ wallets }: IApplicationState) => ({
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  createCont: (data: IEthContractFormValues) => dispatch(createContract(data)),
})

export const CreateContract = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateContractPage)
